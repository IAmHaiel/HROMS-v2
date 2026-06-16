using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Approval;
using OTMS.Entities.DTOs.Approval.Responses;
using OTMS.Entities.DTOs.Dashboard.Responses;
using OTMS.Entities.Models;
using OTMS.Hubs;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Service.Services
{
    public class ApprovalRoutingEngine(
        OTMSDbContext context,
        IHttpContextAccessor httpContextAccessor,
        IActivityLogService activityLogService,
        INotificationService notificationService,
        IHubContext<WorkflowHub> hubContext
        ) : IApprovalRoutingEngine
    {
        public async Task<ApiResponseDTO<ApprovalRequestResponseDTO>> SubmitForApprovalAsync(SubmitApprovalRequestDTO request)
        {
            var loggedInAccount = await GetLoggedInAccountAsync();
            if (loggedInAccount == null)
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Invalid user session.",
                    Data = null
                };

            var matrix = await context.ApprovalRoutingMatrices
                .Include(m => m.Tiers)
                .FirstOrDefaultAsync(m => m.RequestType == request.RequestType && m.IsActive);

            if (matrix == null || matrix.Tiers.Count == 0)
            {
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = $"No active routing matrix configured for request type '{request.RequestType}'.",
                    Data = null
                };
            }

            var approvalRequest = new ApprovalRequest
            {
                ApprovalRequestId = Guid.NewGuid(),
                RequestType = request.RequestType,
                SourceEntityType = request.SourceEntityType,
                SourceEntityId = request.SourceEntityId,
                RequesterAccountId = loggedInAccount.AccountId,
                CurrentTierLevel = 0,
                TotalTierCount = matrix.Tiers.Count,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            context.ApprovalRequests.Add(approvalRequest);
            await context.SaveChangesAsync();

            var routeResult = await RouteToNextTierAsync(approvalRequest, matrix);

            if (routeResult.IsSuccess)
            {
                var firstTier = matrix.Tiers.FirstOrDefault(t => t.TierLevel == 1);
                approvalRequest.StatusTrackingText = firstTier != null
                    ? $"Pending {FormatRoleName(firstTier.ApproverRole)} Approval"
                    : "Pending Approval";
                await context.SaveChangesAsync();
                await NotifyTrackerUpdateAsync(approvalRequest);
            }
            if (!routeResult.IsSuccess)
            {
                context.ApprovalRequests.Remove(approvalRequest);
                await context.SaveChangesAsync();
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = routeResult.Message,
                    Data = null
                };
            }

            await activityLogService.LogActivityAsync(
                loggedInAccount.AccountId,
                ActivityTypes.ApprovalRequestSubmitted,
                $"{request.RequestType} request submitted for approval by {GetEmployeeName(loggedInAccount)}."
            );

            var response = await MapToResponseAsync(approvalRequest);
            return new ApiResponseDTO<ApprovalRequestResponseDTO>
            {
                IsSuccess = true,
                Message = "Request submitted and routed for approval.",
                Data = response
            };
        }

        public async Task<ApiResponseDTO<ApprovalRequestResponseDTO>> ProcessTierDecisionAsync(
            Guid approvalRequestId, ApprovalDecisionDTO decision)
        {
            var loggedInAccount = await GetLoggedInAccountAsync();
            if (loggedInAccount == null)
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Invalid user session.",
                    Data = null
                };

            var approvalRequest = await context.ApprovalRequests
                .Include(ar => ar.Requester)
                    .ThenInclude(a => a.Employee)
                .Include(ar => ar.Decisions)
                .FirstOrDefaultAsync(ar => ar.ApprovalRequestId == approvalRequestId);

            if (approvalRequest == null)
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Approval request not found.",
                    Data = null
                };

            if (approvalRequest.Status != "Pending")
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = "This request has already been processed.",
                    Data = null
                };

            if (approvalRequest.CurrentApproverAccountId != loggedInAccount.AccountId)
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = "You are not the assigned approver for this tier.",
                    Data = null
                };

            var matrix = await context.ApprovalRoutingMatrices
                .Include(m => m.Tiers)
                .FirstOrDefaultAsync(m => m.RequestType == approvalRequest.RequestType && m.IsActive);

            if (matrix == null)
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Routing matrix not found or inactive.",
                    Data = null
                };

            var currentTier = matrix.Tiers.FirstOrDefault(t => t.TierLevel == approvalRequest.CurrentTierLevel);
            if (currentTier == null)
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Current tier configuration not found.",
                    Data = null
                };

            if (decision.Decision == "Rejected")
            {
                if (string.IsNullOrWhiteSpace(decision.Remarks))
                    return new ApiResponseDTO<ApprovalRequestResponseDTO>
                    {
                        IsSuccess = false,
                        Message = "Remarks are mandatory when rejecting a request.",
                        Data = null
                    };

                var rejection = new ApprovalDecision
                {
                    ApprovalDecisionId = Guid.NewGuid(),
                    ApprovalRequestId = approvalRequest.ApprovalRequestId,
                    TierLevel = approvalRequest.CurrentTierLevel,
                    ApproverAccountId = loggedInAccount.AccountId,
                    Decision = "Rejected",
                    Remarks = decision.Remarks,
                    CreatedAt = DateTime.UtcNow
                };

                context.ApprovalDecisions.Add(rejection);
                approvalRequest.Status = "Rejected";
                approvalRequest.StatusTrackingText = $"Rejected by {FormatRoleName(currentTier.ApproverRole)}";
                approvalRequest.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();

                await activityLogService.LogActivityAsync(
                    loggedInAccount.AccountId,
                    ActivityTypes.ApprovalTierRejected,
                    $"{approvalRequest.RequestType} request rejected at Tier {approvalRequest.CurrentTierLevel} by {GetEmployeeName(loggedInAccount)}. Remarks: {decision.Remarks}"
                );

                await notificationService.DispatchRequesterNotificationAsync(
                    approvalRequest.RequesterAccountId, approvalRequest, "Rejected"
                );

                await NotifyTrackerUpdateAsync(approvalRequest);

                var response = await MapToResponseAsync(approvalRequest);
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = true,
                    Message = "Request has been rejected.",
                    Data = response
                };
            }
            else if (decision.Decision == "Approved")
            {
                var approval = new ApprovalDecision
                {
                    ApprovalDecisionId = Guid.NewGuid(),
                    ApprovalRequestId = approvalRequest.ApprovalRequestId,
                    TierLevel = approvalRequest.CurrentTierLevel,
                    ApproverAccountId = loggedInAccount.AccountId,
                    Decision = "Approved",
                    Remarks = decision.Remarks,
                    CreatedAt = DateTime.UtcNow
                };

                context.ApprovalDecisions.Add(approval);
                await context.SaveChangesAsync();

                await activityLogService.LogActivityAsync(
                    loggedInAccount.AccountId,
                    ActivityTypes.ApprovalTierApproved,
                    $"{approvalRequest.RequestType} request approved at Tier {approvalRequest.CurrentTierLevel} by {GetEmployeeName(loggedInAccount)}."
                );

                if (currentTier.IsFinalTier)
                {
                    approvalRequest.Status = "Approved";
                    approvalRequest.StatusTrackingText = "Approved";
                    approvalRequest.CurrentApproverAccountId = null;
                    approvalRequest.UpdatedAt = DateTime.UtcNow;
                    await context.SaveChangesAsync();

                    await ExecuteFinalActionAsync(approvalRequest);

                    await activityLogService.LogActivityAsync(
                        loggedInAccount.AccountId,
                        ActivityTypes.ApprovalRequestFullyApproved,
                        $"{approvalRequest.RequestType} request fully approved and processed."
                    );

                    await notificationService.DispatchRequesterNotificationAsync(
                        approvalRequest.RequesterAccountId, approvalRequest, "Approved"
                    );

                    await NotifyTrackerUpdateAsync(approvalRequest);

                    var response = await MapToResponseAsync(approvalRequest);
                    return new ApiResponseDTO<ApprovalRequestResponseDTO>
                    {
                        IsSuccess = true,
                        Message = "Request fully approved and processed.",
                        Data = response
                    };
                }
                else
                {
                    var nextTier = matrix.Tiers.FirstOrDefault(t => t.TierLevel == approvalRequest.CurrentTierLevel + 1);
                    approvalRequest.StatusTrackingText = nextTier != null
                        ? $"Pending {FormatRoleName(nextTier.ApproverRole)} Approval"
                        : "Pending Next Approval";

                    var routeResult = await RouteToNextTierAsync(approvalRequest, matrix);
                    if (!routeResult.IsSuccess)
                    {
                        return new ApiResponseDTO<ApprovalRequestResponseDTO>
                        {
                            IsSuccess = false,
                            Message = routeResult.Message,
                            Data = null
                        };
                    }

                    await context.SaveChangesAsync();

                    await notificationService.DispatchRequesterNotificationAsync(
                        approvalRequest.RequesterAccountId, approvalRequest, "TierApproved"
                    );

                    await NotifyTrackerUpdateAsync(approvalRequest);

                    var routedResponse = await MapToResponseAsync(approvalRequest);
                    return new ApiResponseDTO<ApprovalRequestResponseDTO>
                    {
                        IsSuccess = true,
                        Message = "Request approved and routed to the next level.",
                        Data = routedResponse
                    };
                }
            }
            else
            {
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Invalid decision. Must be 'Approved' or 'Rejected'.",
                    Data = null
                };
            }
        }

        public async Task<ApiResponseDTO<ApprovalRequestResponseDTO>> GetRequestStatusAsync(Guid approvalRequestId)
        {
            var approvalRequest = await context.ApprovalRequests
                .Include(ar => ar.Decisions)
                    .ThenInclude(d => d.Approver)
                        .ThenInclude(a => a.Employee)
                .Include(ar => ar.Requester)
                    .ThenInclude(a => a.Employee)
                .Include(ar => ar.CurrentApprover)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(ar => ar.ApprovalRequestId == approvalRequestId);

            if (approvalRequest == null)
                return new ApiResponseDTO<ApprovalRequestResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Approval request not found.",
                    Data = null
                };

            var response = await MapToResponseAsync(approvalRequest);
            return new ApiResponseDTO<ApprovalRequestResponseDTO>
            {
                IsSuccess = true,
                Message = "Request retrieved successfully.",
                Data = response
            };
        }

        public async Task<ApiResponseDTO<List<PendingApprovalResponseDTO>>> GetPendingApprovalsAsync(Guid approverAccountId)
        {
            var pendingRequests = await context.ApprovalRequests
                .Include(ar => ar.Requester)
                    .ThenInclude(a => a.Employee)
                .Where(ar => ar.CurrentApproverAccountId == approverAccountId && ar.Status == "Pending")
                .OrderByDescending(ar => ar.CreatedAt)
                .ToListAsync();

            var response = pendingRequests.Select(ar => new PendingApprovalResponseDTO
            {
                ApprovalRequestId = ar.ApprovalRequestId,
                RequestType = ar.RequestType,
                RequesterName = GetEmployeeName(ar.Requester),
                RequesterEmployeeNumber = ar.Requester.Employee.EmployeeNumber,
                CurrentTierLevel = ar.CurrentTierLevel,
                Status = ar.Status,
                CreatedAt = ar.CreatedAt
            }).ToList();

            return new ApiResponseDTO<List<PendingApprovalResponseDTO>>
            {
                IsSuccess = true,
                Message = response.Count > 0 ? "Pending approvals retrieved." : "No pending approvals.",
                Data = response
            };
        }

        public async Task<ApiResponseDTO<List<ApprovalRequestResponseDTO>>> GetMyRequestsAsync(Guid requesterAccountId)
        {
            var requests = await context.ApprovalRequests
                .Include(ar => ar.Decisions)
                    .ThenInclude(d => d.Approver)
                        .ThenInclude(a => a.Employee)
                .Include(ar => ar.Requester)
                    .ThenInclude(a => a.Employee)
                .Include(ar => ar.CurrentApprover)
                    .ThenInclude(a => a.Employee)
                .Where(ar => ar.RequesterAccountId == requesterAccountId)
                .OrderByDescending(ar => ar.CreatedAt)
                .ToListAsync();

            var responses = new List<ApprovalRequestResponseDTO>();
            foreach (var request in requests)
            {
                responses.Add(await MapToResponseAsync(request));
            }

            return new ApiResponseDTO<List<ApprovalRequestResponseDTO>>
            {
                IsSuccess = true,
                Message = responses.Count > 0 ? "Requests retrieved." : "No requests found.",
                Data = responses
            };
        }

        private async Task<ApiResponseDTO<object>> RouteToNextTierAsync(ApprovalRequest approvalRequest, ApprovalRoutingMatrix matrix)
        {
            var nextTierLevel = approvalRequest.CurrentTierLevel + 1;
            var nextTier = matrix.Tiers.FirstOrDefault(t => t.TierLevel == nextTierLevel);

            if (nextTier == null)
                return new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = "Routing error: No approver configuration found for the next tier.",
                    Data = null
                };

            Guid? approverAccountId;
            if (nextTierLevel == 1)
            {
                approverAccountId = await ResolveSupervisorAsync(approvalRequest.RequesterAccountId);
            }
            else
            {
                approverAccountId = await ResolveRoleApproverAsync(nextTier.ApproverRole, nextTier.FallbackApproverRole);
            }

            if (approverAccountId == null || approverAccountId.Value == Guid.Empty)
                return new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = "Routing error: No active approver found for the next tier.",
                    Data = null
                };

            approvalRequest.CurrentTierLevel = nextTierLevel;
            approvalRequest.CurrentApproverAccountId = approverAccountId;
            approvalRequest.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            var approver = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == approverAccountId);

            await activityLogService.LogActivityAsync(
                approvalRequest.RequesterAccountId,
                ActivityTypes.ApprovalRequestRouted,
                $"{approvalRequest.RequestType} request routed to Tier {nextTierLevel}: {GetEmployeeName(approver)}."
            );

            if (approver != null)
            {
                await notificationService.DispatchApproverNotificationAsync(approver.AccountId, approvalRequest);
            }

            return new ApiResponseDTO<object>
            {
                IsSuccess = true,
                Message = $"Routed to Tier {nextTierLevel}.",
                Data = null
            };
        }

        private async Task<Guid?> ResolveSupervisorAsync(Guid requesterAccountId)
        {
            var requester = await context.Accounts
                .Include(a => a.Employee)
                    .ThenInclude(e => e.Department)
                .FirstOrDefaultAsync(a => a.AccountId == requesterAccountId);

            if (requester?.Employee?.Department?.HeadEmployeeId == null)
                return null;

            var supervisor = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.EmployeeId == requester.Employee.Department.HeadEmployeeId.Value);

            return supervisor?.Account?.AccountId;
        }

        private async Task<Guid?> ResolveRoleApproverAsync(string roleName, string? fallbackRoleName)
        {
            var account = await context.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Role.Name == roleName
                    && a.AccountStatus == "Active");

            if (account == null && !string.IsNullOrWhiteSpace(fallbackRoleName))
            {
                account = await context.Accounts
                    .Include(a => a.Role)
                    .FirstOrDefaultAsync(a => a.Role.Name == fallbackRoleName
                        && a.AccountStatus == "Active");
            }

            return account?.AccountId;
        }

        private async System.Threading.Tasks.Task ExecuteFinalActionAsync(ApprovalRequest approvalRequest)
        {
            switch (approvalRequest.RequestType)
            {
                case "Leave":
                    await ExecuteLeaveFinalActionAsync(approvalRequest);
                    break;
                case "Asset":
                    await ExecuteAssetFinalActionAsync(approvalRequest);
                    break;
                case "Resignation":
                    await ExecuteResignationFinalActionAsync(approvalRequest);
                    break;
                case "e-NTE":
                    await ExecuteNTEFinalActionAsync(approvalRequest);
                    break;
                case "Offboarding":
                    await ExecuteOffboardingFinalActionAsync(approvalRequest);
                    break;
            }
        }

        private async System.Threading.Tasks.Task ExecuteLeaveFinalActionAsync(ApprovalRequest approvalRequest)
        {
            var leaveRequest = await context.LeaveRequests
                .Include(lr => lr.Account)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(lr => lr.LeaveId == approvalRequest.SourceEntityId);

            if (leaveRequest == null) return;

            leaveRequest.Approval_Status = "Approved";
            leaveRequest.Approved_By = approvalRequest.Decisions
                .OrderByDescending(d => d.TierLevel)
                .Select(d => d.ApproverAccountId)
                .FirstOrDefault();
            leaveRequest.UpdatedAt = DateTime.UtcNow;

            var account = leaveRequest.Account;
            account.AccountStatus = "On Leave";
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                approvalRequest.Decisions.OrderByDescending(d => d.TierLevel).First().ApproverAccountId,
                ActivityTypes.LeaveStatusUpdated,
                $"Leave request approved. Employee {GetEmployeeName(account)} set to On Leave.");
        }

        private async System.Threading.Tasks.Task ExecuteAssetFinalActionAsync(ApprovalRequest approvalRequest)
        {
            var account = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == approvalRequest.RequesterAccountId);

            if (account?.Employee == null) return;

            var allocation = new AssetAllocation
            {
                AssetAllocationId = Guid.NewGuid(),
                EmployeeId = account.Employee.EmployeeId,
                AssetType = approvalRequest.SourceEntityType,
                AssetDescription = $"Asset allocated via approval {approvalRequest.ApprovalRequestId}",
                Status = "Allocated",
                AllocatedAt = DateTime.UtcNow,
                ApprovedByRequestId = approvalRequest.ApprovalRequestId
            };

            context.AssetAllocations.Add(allocation);
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                approvalRequest.Decisions.OrderByDescending(d => d.TierLevel).First().ApproverAccountId,
                ActivityTypes.AssetAllocated,
                $"Asset allocated to {GetEmployeeName(account)} via approval {approvalRequest.ApprovalRequestId}.");
        }

        private async System.Threading.Tasks.Task ExecuteResignationFinalActionAsync(ApprovalRequest approvalRequest)
        {
            var account = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == approvalRequest.RequesterAccountId);

            if (account?.Employee == null) return;

            account.Employee.EmploymentStatus = "Resigned";
            account.Employee.ResignationDate = DateTime.UtcNow;
            account.AccountStatus = "Inactive";
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                approvalRequest.Decisions.OrderByDescending(d => d.TierLevel).First().ApproverAccountId,
                ActivityTypes.ResignationProcessed,
                $"Resignation processed for {GetEmployeeName(account)}.");
        }

        private async System.Threading.Tasks.Task ExecuteNTEFinalActionAsync(ApprovalRequest approvalRequest)
        {
            var account = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == approvalRequest.RequesterAccountId);

            if (account?.Employee == null) return;

            account.Employee.NTEDate = DateTime.UtcNow;
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                approvalRequest.Decisions.OrderByDescending(d => d.TierLevel).First().ApproverAccountId,
                ActivityTypes.NTEProcessed,
                $"NTE processed for {GetEmployeeName(account)}.");
        }

        private async System.Threading.Tasks.Task ExecuteOffboardingFinalActionAsync(ApprovalRequest approvalRequest)
        {
            var account = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == approvalRequest.RequesterAccountId);

            if (account?.Employee == null) return;

            account.Employee.EmploymentStatus = "Offboarded";
            account.Employee.OffboardingDate = DateTime.UtcNow;
            account.Employee.OffboardingRemarks = "Offboarding completed via approval workflow.";
            account.AccountStatus = "Inactive";
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                approvalRequest.Decisions.OrderByDescending(d => d.TierLevel).First().ApproverAccountId,
                ActivityTypes.OffboardingProcessed,
                $"Offboarding processed for {GetEmployeeName(account)}.");
        }

        private async Task<Account?> GetLoggedInAccountAsync()
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User
                .FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(accountIdClaim)) return null;

            var accountId = Guid.Parse(accountIdClaim);
            return await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == accountId);
        }

        private async Task<ApprovalRequestResponseDTO> MapToResponseAsync(ApprovalRequest approvalRequest)
        {
            await context.Entry(approvalRequest).Reference(ar => ar.Requester).LoadAsync();
            await context.Entry(approvalRequest.Requester).Reference(a => a.Employee).LoadAsync();

            if (approvalRequest.CurrentApprover != null)
            {
                await context.Entry(approvalRequest.CurrentApprover).Reference(a => a.Employee).LoadAsync();
            }

            await context.Entry(approvalRequest).Collection(ar => ar.Decisions).LoadAsync();
            foreach (var decision in approvalRequest.Decisions)
            {
                await context.Entry(decision).Reference(d => d.Approver).LoadAsync();
                await context.Entry(decision.Approver).Reference(a => a.Employee).LoadAsync();
            }

            var requesterEmp = approvalRequest.Requester?.Employee;

            string? currentTierLabel = null;
            if (approvalRequest.CurrentTierLevel > 0)
            {
                var matrix = await context.ApprovalRoutingMatrices
                    .Include(m => m.Tiers)
                    .FirstOrDefaultAsync(m => m.RequestType == approvalRequest.RequestType && m.IsActive);
                var currentTier = matrix?.Tiers.FirstOrDefault(t => t.TierLevel == approvalRequest.CurrentTierLevel);
                if (currentTier != null)
                {
                    currentTierLabel = FormatRoleName(currentTier.ApproverRole);
                }
            }

            return new ApprovalRequestResponseDTO
            {
                ApprovalRequestId = approvalRequest.ApprovalRequestId,
                RequestType = approvalRequest.RequestType,
                SourceEntityType = approvalRequest.SourceEntityType,
                SourceEntityId = approvalRequest.SourceEntityId,
                RequesterName = GetEmployeeName(approvalRequest.Requester),
                RequesterEmployeeNumber = requesterEmp?.EmployeeNumber,
                CurrentTierLevel = approvalRequest.CurrentTierLevel,
                TotalTierCount = approvalRequest.TotalTierCount,
                CurrentTierLabel = currentTierLabel,
                StatusTrackingText = approvalRequest.StatusTrackingText,
                CurrentApproverName = approvalRequest.CurrentApprover != null
                    ? GetEmployeeName(approvalRequest.CurrentApprover) : null,
                Status = approvalRequest.Status,
                CreatedAt = approvalRequest.CreatedAt,
                UpdatedAt = approvalRequest.UpdatedAt,
                Decisions = approvalRequest.Decisions.OrderBy(d => d.TierLevel).Select(d => new ApprovalDecisionResponseDTO
                {
                    ApprovalDecisionId = d.ApprovalDecisionId,
                    TierLevel = d.TierLevel,
                    ApproverName = GetEmployeeName(d.Approver),
                    Decision = d.Decision,
                    Remarks = d.Remarks,
                    CreatedAt = d.CreatedAt
                }).ToList()
            };
        }

        public async Task<ApiResponseDTO<WorkflowTrackerDTO>> GetTrackerAsync(Guid approvalRequestId)
        {
            var request = await context.ApprovalRequests
                .Include(ar => ar.Decisions)
                    .ThenInclude(d => d.Approver)
                        .ThenInclude(a => a.Employee)
                .Include(ar => ar.Requester)
                    .ThenInclude(a => a.Employee)
                .Include(ar => ar.CurrentApprover)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(ar => ar.ApprovalRequestId == approvalRequestId);

            if (request == null)
                return new ApiResponseDTO<WorkflowTrackerDTO>
                {
                    IsSuccess = false,
                    Message = "Approval request not found.",
                    Data = null
                };

            var tracker = await MapToTrackerDTOAsync(request);
            return new ApiResponseDTO<WorkflowTrackerDTO>
            {
                IsSuccess = true,
                Message = "Tracker retrieved successfully.",
                Data = tracker
            };
        }

        public async Task<ApiResponseDTO<List<WorkflowTrackerDTO>>> GetMyTrackersAsync(Guid requesterAccountId)
        {
            var requests = await context.ApprovalRequests
                .Include(ar => ar.Decisions)
                    .ThenInclude(d => d.Approver)
                        .ThenInclude(a => a.Employee)
                .Include(ar => ar.Requester)
                    .ThenInclude(a => a.Employee)
                .Include(ar => ar.CurrentApprover)
                    .ThenInclude(a => a.Employee)
                .Where(ar => ar.RequesterAccountId == requesterAccountId)
                .OrderByDescending(ar => ar.CreatedAt)
                .ToListAsync();

            var trackers = new List<WorkflowTrackerDTO>();
            foreach (var request in requests)
            {
                trackers.Add(await MapToTrackerDTOAsync(request));
            }

            return new ApiResponseDTO<List<WorkflowTrackerDTO>>
            {
                IsSuccess = true,
                Message = trackers.Count > 0 ? "Trackers retrieved." : "No trackers found.",
                Data = trackers
            };
        }

        private async Task<WorkflowTrackerDTO> MapToTrackerDTOAsync(ApprovalRequest approvalRequest)
        {
            var requesterEmp = approvalRequest.Requester?.Employee;

            string? currentTierLabel = null;
            if (approvalRequest.CurrentTierLevel > 0)
            {
                var matrix = await context.ApprovalRoutingMatrices
                    .Include(m => m.Tiers)
                    .FirstOrDefaultAsync(m => m.RequestType == approvalRequest.RequestType && m.IsActive);
                var currentTier = matrix?.Tiers.FirstOrDefault(t => t.TierLevel == approvalRequest.CurrentTierLevel);
                if (currentTier != null)
                {
                    currentTierLabel = FormatRoleName(currentTier.ApproverRole);
                }
            }

            return new WorkflowTrackerDTO
            {
                ApprovalRequestId = approvalRequest.ApprovalRequestId,
                RequestType = approvalRequest.RequestType,
                SourceEntityType = approvalRequest.SourceEntityType,
                SourceEntityId = approvalRequest.SourceEntityId,
                StatusTrackingText = approvalRequest.StatusTrackingText ?? "Pending",
                CurrentTierLevel = approvalRequest.CurrentTierLevel,
                TotalTierCount = approvalRequest.TotalTierCount,
                CurrentTierLabel = currentTierLabel,
                CurrentApproverName = approvalRequest.CurrentApprover != null
                    ? GetEmployeeName(approvalRequest.CurrentApprover) : null,
                Status = approvalRequest.Status,
                CreatedAt = approvalRequest.CreatedAt,
                UpdatedAt = approvalRequest.UpdatedAt,
                Decisions = approvalRequest.Decisions.OrderBy(d => d.TierLevel).Select(d => new ApprovalDecisionResponseDTO
                {
                    ApprovalDecisionId = d.ApprovalDecisionId,
                    TierLevel = d.TierLevel,
                    ApproverName = GetEmployeeName(d.Approver),
                    Decision = d.Decision,
                    Remarks = d.Remarks,
                    CreatedAt = d.CreatedAt
                }).ToList()
            };
        }

        private async System.Threading.Tasks.Task NotifyTrackerUpdateAsync(ApprovalRequest approvalRequest)
        {
            try
            {
                var approvalRequestId = approvalRequest.ApprovalRequestId.ToString();
                await hubContext.Clients.Group(approvalRequestId).SendAsync("TrackerUpdated", approvalRequestId);
                await hubContext.Clients.Group($"user_{approvalRequest.RequesterAccountId}").SendAsync("TrackerUpdated", approvalRequestId);
                if (approvalRequest.CurrentApproverAccountId.HasValue)
                {
                    await hubContext.Clients.Group($"user_{approvalRequest.CurrentApproverAccountId}").SendAsync("TrackerUpdated", approvalRequestId);
                }
            }
            catch
            {
                // Silently fail - real-time notification failure should not break the flow
            }
        }

        private static string FormatRoleName(string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName)) return "Unknown";

            // Convert PascalCase or camelCase to readable: "ImmediateSupervisor" -> "Immediate Supervisor"
            var readable = System.Text.RegularExpressions.Regex.Replace(roleName, "([a-z])([A-Z])", "$1 $2");
            readable = System.Text.RegularExpressions.Regex.Replace(readable, "([A-Z])([A-Z][a-z])", "$1 $2");
            return readable;
        }

        private static string GetEmployeeName(Account account)
        {
            if (account?.Employee == null) return "Unknown";
            var emp = account.Employee;
            return string.Join(" ", new[] { emp.FirstName, emp.MiddleName, emp.LastName, emp.Suffix }
                .Where(n => !string.IsNullOrEmpty(n)));
        }

        // ── Cancel Request ──
        public async Task<ApiResponseDTO<ApprovalRequestResponseDTO>> CancelRequestAsync(Guid approvalRequestId, CancelApprovalRequestDTO dto)
        {
            var user = await GetLoggedInAccountAsync();
            if (user == null)
                return new ApiResponseDTO<ApprovalRequestResponseDTO> { IsSuccess = false, Message = "User not authenticated." };

            var request = await context.ApprovalRequests
                .Include(ar => ar.Requester).ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(ar => ar.ApprovalRequestId == approvalRequestId);

            if (request == null)
                return new ApiResponseDTO<ApprovalRequestResponseDTO> { IsSuccess = false, Message = "Approval request not found." };
            if (request.RequesterAccountId != user.AccountId)
                return new ApiResponseDTO<ApprovalRequestResponseDTO> { IsSuccess = false, Message = "You can only cancel your own requests." };
            if (request.Status != "Pending")
                return new ApiResponseDTO<ApprovalRequestResponseDTO> { IsSuccess = false, Message = "Only pending requests can be cancelled." };

            request.Status = "Cancelled";
            request.StatusTrackingText = $"Cancelled by requester. Reason: {dto?.Reason ?? "No reason provided"}";
            request.UpdatedAt = DateTime.UtcNow;
            request.CurrentApproverAccountId = null;

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(user.AccountId, ActivityTypes.ApprovalRequestCancelled,
                $"Approval request {approvalRequestId} ({request.RequestType}) was cancelled by the requester.");

            await NotifyTrackerUpdateAsync(request);

            return new ApiResponseDTO<ApprovalRequestResponseDTO>
            {
                IsSuccess = true,
                Message = "Request cancelled successfully.",
                Data = await MapToResponseAsync(request)
            };
        }

        // ── Matrix CRUD ──
        public async Task<ApiResponseDTO<List<RoutingMatrixResponseDTO>>> GetAllMatricesAsync()
        {
            var matrices = await context.ApprovalRoutingMatrices
                .Include(m => m.Tiers)
                .OrderBy(m => m.RequestType)
                .Select(m => new RoutingMatrixResponseDTO
                {
                    RoutingMatrixId = m.RoutingMatrixId,
                    RequestType = m.RequestType,
                    IsActive = m.IsActive,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt,
                    Tiers = m.Tiers.OrderBy(t => t.TierLevel).Select(t => new TierResponseDTO
                    {
                        TierId = t.TierId,
                        TierLevel = t.TierLevel,
                        ApproverRole = t.ApproverRole,
                        FallbackApproverRole = t.FallbackApproverRole,
                        IsFinalTier = t.IsFinalTier
                    }).ToList()
                })
                .ToListAsync();

            return new ApiResponseDTO<List<RoutingMatrixResponseDTO>>
            {
                IsSuccess = true,
                Message = matrices.Any() ? "Routing matrices retrieved." : "No routing matrices found.",
                Data = matrices
            };
        }

        public async Task<ApiResponseDTO<RoutingMatrixResponseDTO>> GetMatrixByIdAsync(Guid matrixId)
        {
            var matrix = await context.ApprovalRoutingMatrices
                .Include(m => m.Tiers)
                .FirstOrDefaultAsync(m => m.RoutingMatrixId == matrixId);

            if (matrix == null)
                return new ApiResponseDTO<RoutingMatrixResponseDTO> { IsSuccess = false, Message = "Routing matrix not found." };

            return new ApiResponseDTO<RoutingMatrixResponseDTO>
            {
                IsSuccess = true,
                Message = "Routing matrix retrieved.",
                Data = MapMatrixToDTO(matrix)
            };
        }

        public async Task<ApiResponseDTO<RoutingMatrixResponseDTO>> CreateMatrixAsync(CreateRoutingMatrixDTO dto)
        {
            var user = await GetLoggedInAccountAsync();
            if (user == null)
                return new ApiResponseDTO<RoutingMatrixResponseDTO> { IsSuccess = false, Message = "User not authenticated." };

            if (await context.ApprovalRoutingMatrices.AnyAsync(m => m.RequestType == dto.RequestType))
                return new ApiResponseDTO<RoutingMatrixResponseDTO> { IsSuccess = false, Message = $"A matrix for '{dto.RequestType}' already exists." };

            var matrix = new ApprovalRoutingMatrix
            {
                RoutingMatrixId = Guid.NewGuid(),
                RequestType = dto.RequestType,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Tiers = dto.Tiers.Select(t => new ApprovalTier
                {
                    TierId = Guid.NewGuid(),
                    TierLevel = t.TierLevel,
                    ApproverRole = t.ApproverRole,
                    FallbackApproverRole = t.FallbackApproverRole,
                    IsFinalTier = t.IsFinalTier,
                    CreatedAt = DateTime.UtcNow
                }).ToList()
            };

            context.ApprovalRoutingMatrices.Add(matrix);
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(user.AccountId, ActivityTypes.RoutingMatrixCreated,
                $"Created routing matrix for '{dto.RequestType}' with {dto.Tiers.Count} tier(s).");

            return new ApiResponseDTO<RoutingMatrixResponseDTO>
            {
                IsSuccess = true,
                Message = "Routing matrix created successfully.",
                Data = MapMatrixToDTO(matrix)
            };
        }

        public async Task<ApiResponseDTO<RoutingMatrixResponseDTO>> UpdateMatrixAsync(Guid matrixId, CreateRoutingMatrixDTO dto)
        {
            var user = await GetLoggedInAccountAsync();
            if (user == null)
                return new ApiResponseDTO<RoutingMatrixResponseDTO> { IsSuccess = false, Message = "User not authenticated." };

            var matrix = await context.ApprovalRoutingMatrices
                .Include(m => m.Tiers)
                .FirstOrDefaultAsync(m => m.RoutingMatrixId == matrixId);

            if (matrix == null)
                return new ApiResponseDTO<RoutingMatrixResponseDTO> { IsSuccess = false, Message = "Routing matrix not found." };

            matrix.RequestType = dto.RequestType;
            matrix.UpdatedAt = DateTime.UtcNow;

            context.ApprovalTiers.RemoveRange(matrix.Tiers);
            matrix.Tiers = dto.Tiers.Select(t => new ApprovalTier
            {
                TierId = Guid.NewGuid(),
                TierLevel = t.TierLevel,
                ApproverRole = t.ApproverRole,
                FallbackApproverRole = t.FallbackApproverRole,
                IsFinalTier = t.IsFinalTier,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(user.AccountId, ActivityTypes.RoutingMatrixUpdated,
                $"Updated routing matrix for '{dto.RequestType}'.");

            return new ApiResponseDTO<RoutingMatrixResponseDTO>
            {
                IsSuccess = true,
                Message = "Routing matrix updated successfully.",
                Data = MapMatrixToDTO(matrix)
            };
        }

        public async Task<ApiResponseDTO<object>> ToggleMatrixActiveAsync(Guid matrixId)
        {
            var user = await GetLoggedInAccountAsync();
            if (user == null)
                return new ApiResponseDTO<object> { IsSuccess = false, Message = "User not authenticated." };

            var matrix = await context.ApprovalRoutingMatrices.FindAsync(matrixId);
            if (matrix == null)
                return new ApiResponseDTO<object> { IsSuccess = false, Message = "Routing matrix not found." };

            matrix.IsActive = !matrix.IsActive;
            matrix.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(user.AccountId, ActivityTypes.RoutingMatrixToggled,
                $"Toggled routing matrix '{matrix.RequestType}' to {(matrix.IsActive ? "Active" : "Inactive")}.");

            return new ApiResponseDTO<object>
            {
                IsSuccess = true,
                Message = $"Routing matrix {(matrix.IsActive ? "activated" : "deactivated")} successfully.",
                Data = null
            };
        }

        public async Task<ApiResponseDTO<object>> DeleteMatrixAsync(Guid matrixId)
        {
            var user = await GetLoggedInAccountAsync();
            if (user == null)
                return new ApiResponseDTO<object> { IsSuccess = false, Message = "User not authenticated." };

            var matrix = await context.ApprovalRoutingMatrices
                .Include(m => m.Tiers)
                .FirstOrDefaultAsync(m => m.RoutingMatrixId == matrixId);

            if (matrix == null)
                return new ApiResponseDTO<object> { IsSuccess = false, Message = "Routing matrix not found." };

            var requestType = matrix.RequestType;
            context.ApprovalTiers.RemoveRange(matrix.Tiers);
            context.ApprovalRoutingMatrices.Remove(matrix);
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(user.AccountId, ActivityTypes.RoutingMatrixDeleted,
                $"Deleted routing matrix for '{requestType}'.");

            return new ApiResponseDTO<object>
            {
                IsSuccess = true,
                Message = "Routing matrix deleted successfully.",
                Data = null
            };
        }

        private static RoutingMatrixResponseDTO MapMatrixToDTO(ApprovalRoutingMatrix matrix)
        {
            return new RoutingMatrixResponseDTO
            {
                RoutingMatrixId = matrix.RoutingMatrixId,
                RequestType = matrix.RequestType,
                IsActive = matrix.IsActive,
                CreatedAt = matrix.CreatedAt,
                UpdatedAt = matrix.UpdatedAt,
                Tiers = matrix.Tiers.OrderBy(t => t.TierLevel).Select(t => new TierResponseDTO
                {
                    TierId = t.TierId,
                    TierLevel = t.TierLevel,
                    ApproverRole = t.ApproverRole,
                    FallbackApproverRole = t.FallbackApproverRole,
                    IsFinalTier = t.IsFinalTier
                }).ToList()
            };
        }
    }
}
