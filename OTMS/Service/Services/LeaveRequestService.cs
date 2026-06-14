using System.Security.Claims;
using System.Security.Principal;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.LeaveRequest;
using OTMS.Entities.DTOs.LeaveRequest.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class LeaveRequestService(
        OTMSDbContext context,
        IHttpContextAccessor httpContextAccessor,
        INotificationService notificationService,
        IActivityLogService activityLogService
        ) : ILeaveRequest
    {
        public async Task<LeaveRequestResponseDTO> CreateLeaveRequestAsync(CreateLeaveRequestDTO request)
        {
            // Get the Account
            var claimProfile = httpContextAccessor
               .HttpContext?
               .User
               .FindFirst(ClaimTypes.NameIdentifier)?
               .Value;

            if (string.IsNullOrEmpty(claimProfile))
                return null;

            var profile = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.Account.AccountId.ToString() == claimProfile);

            if (profile is null || profile.Account is null)
                return null;

            // Validate
            if (request.End_Date < request.Start_Date)
            {
                throw new ArgumentException("End date cannot be before start date.");
            }

            // Convert DTO to Entity
            var leaveRequest = new LeaveRequest
            {
                AccountId = profile.Account.AccountId,
                Leave_Type = request.Leave_Type,
                Start_Date = request.Start_Date,
                End_Date = request.End_Date,
                Reason = request.Reason,
                Approval_Status = "Pending",
                SubmittedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.LeaveRequests.Add(leaveRequest);
            await context.SaveChangesAsync();

            // Send Notification
            await notificationService.CreateLeaveRequestNotificationAsync(leaveRequest);

            await activityLogService.LogActivityAsync(
                leaveRequest.Account.AccountId,
                ActivityTypes.LeaveRequestSubmitted,
                $"{string.Join(" ", new[]
                    {leaveRequest.Account.Employee.FirstName, leaveRequest.Account.Employee.MiddleName, leaveRequest.Account.Employee.LastName, leaveRequest.Account.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} submitted a Leave Request at {DateTime.Now:hh:mm tt}");

            return new LeaveRequestResponseDTO
            {
                LeaveId = leaveRequest.LeaveId,
                AccountId = leaveRequest.AccountId,
                Start_Date = leaveRequest.Start_Date,
                End_Date = leaveRequest.End_Date,
                Leave_Type = leaveRequest.Leave_Type,
                Reason = leaveRequest.Reason,
                Approval_Status = leaveRequest.Approval_Status,
                SubmittedAt = DateTime.UtcNow
            };
        }

        public async Task<ApiResponseDTO<object>> DeleteLeaveRequestAsync(Guid leaveId)
        {
            var leaveRequest = await context.LeaveRequests
                .Include(lr => lr.Account)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(lr => lr.LeaveId == leaveId);

            if (leaveRequest == null)
                throw new Exception("Leave Request does not exist.");

            leaveRequest.Deleted = true;
            leaveRequest.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return new ApiResponseDTO<object>
            {
                IsSuccess = true,
                Message = $"{leaveRequest.Leave_Type} is deleted.",
                Data = leaveRequest
            };

        }

        public async Task<PaginationResponseDTO<LeaveRequestResponseDTO>> GetAllLeaveRequestsAsync(PaginationDTO request, string? status, string? role, string? search)
        {
            var query = context.LeaveRequests
                    .Include(lr => lr.Account)
                        .ThenInclude(a => a.Employee)
                    .Where(lr => !lr.Deleted)
                    .AsQueryable();

            if (!string.IsNullOrEmpty(status) && status.ToLower() != "all")
            {
                query = query.Where(lr => lr.Approval_Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(lr => lr.Account != null && lr.Account.Role.ToLower() == role.ToLower());
            }

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(lr => lr.Account != null && lr.Account.Employee != null &&
                                         (lr.Account.Employee.FirstName.ToLower().Contains(lowerSearch) ||
                                          lr.Account.Employee.LastName.ToLower().Contains(lowerSearch) ||
                                          lr.Account.Employee.EmployeeNumber.ToLower().Contains(lowerSearch)));
            }

            query = query.OrderByDescending(lr => lr.Start_Date);

            var totalRecords = await query.CountAsync();

            var data = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(lr => new LeaveRequestResponseDTO
                {
                    LeaveId = lr.LeaveId,
                    AccountId = lr.AccountId,
                    EmployeeNumber = lr.Account.Employee.EmployeeNumber,
                    FirstName = lr.Account.Employee.FirstName,
                    MiddleName = lr.Account.Employee.MiddleName,
                    LastName = lr.Account.Employee.LastName,
                    Suffix = lr.Account.Employee.Suffix,
                    Role = lr.Account.Role,
                    Start_Date = lr.Start_Date,
                    End_Date = lr.End_Date,
                    Leave_Type = lr.Leave_Type,
                    Reason = lr.Reason,
                    Approval_Status = lr.Approval_Status,
                    LeaveRequestNote = lr.LeaveRequestNote,
                    SubmittedAt = lr.Start_Date // Assuming Start_Date is the submission date
                }).ToListAsync();

            return new PaginationResponseDTO<LeaveRequestResponseDTO>
            {
                IsSuccess = true,
                Message = "Leave requests retrieved successfully.",
                Data = data,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)request.PageSize)
            };
        }

        public async Task<PaginationResponseDTO<object>> GetMyLeaveRequestsAsync(Guid accountId, PaginationDTO pagination)
        {
            var query = context.LeaveRequests
                .Where(l => l.AccountId == accountId && !l.Deleted)
                .OrderByDescending(l => l.Start_Date);

            var totalRecords = await query.CountAsync();

            var data = await query
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(l => new
                {
                    l.LeaveId,
                    l.AccountId,
                    l.Leave_Type,
                    l.Start_Date,
                    l.End_Date,
                    l.Reason,
                    l.Approval_Status,
                    l.LeaveRequestNote,
                    l.Approved_By,
                })
                .ToListAsync();

            return new PaginationResponseDTO<object>
            {
                IsSuccess = true,
                Message = "Leave requests retrieved successfully.",
                Data = data,
                PageNumber = pagination.PageNumber,
                PageSize = pagination.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)pagination.PageSize)
            };
        }

        public async System.Threading.Tasks.Task UpdateEmployeeAvailabilityStatusesAsync(Guid accountId)
        {
            var currentDate = DateTime.UtcNow.Date;

            var account = await context.Accounts
                .Include(a => a.SubmittedLeaveRequests)
                .Include(a => a.RequestedEmergencyOverrides)
                .FirstOrDefaultAsync(a => a.AccountId == accountId);

            if (account is null)
            {
                throw new Exception("Account not found.");
            }

            // On Leave
            bool isOnLeave = account.SubmittedLeaveRequests
                .Any(lr =>
                    lr.Approval_Status == "Approved" &&
                    currentDate.Date >= lr.Start_Date.Date &&
                    currentDate.Date <= lr.End_Date.Date);

            account.AccountStatus = isOnLeave
                ? "On Leave"
                : "Active";

            // Emergency Overriden
            bool hasActiveOverride = account.RequestedEmergencyOverrides
                .Any(e =>
                    e.Status == "Approved" &&
                    e.OverrideUntil > currentDate);

            if (hasActiveOverride)
                account.AccountStatus = "Emergency Overriden";

            await context.SaveChangesAsync();
            return;
        }

        public async Task<LeaveRequestResponseDTO> UpdateLeaveRequestAsync(UpdateLeaveRequestDTO request)
        {
            // Get the Account
            var claimProfile = httpContextAccessor
               .HttpContext?
               .User
               .FindFirst(ClaimTypes.NameIdentifier)?
               .Value;

            if (string.IsNullOrEmpty(claimProfile))
                return null;

            var profile = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.Account.AccountId.ToString() == claimProfile);

            if (profile is null || profile.Account is null)
                return null;

            // Validate
            if (request.EndDate < request.StartDate)
            {
                throw new ArgumentException("End date cannot be before start date.");
            }

            var leaveRequest = await context.LeaveRequests
                .Include(lr => lr.Account)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(lr => lr.LeaveId == request.LeaveId);

            if (leaveRequest == null)
                throw new Exception("Leave Request doesn't exist.");

            // Update
            leaveRequest.Leave_Type = request.LeaveType;
            leaveRequest.LeaveRequestNote = request.LeaveRequestNote;
            leaveRequest.Start_Date = request.StartDate;
            leaveRequest.End_Date = request.EndDate;
            leaveRequest.Reason = request.Reason;
            leaveRequest.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return new LeaveRequestResponseDTO
            {
                EmployeeNumber = profile.EmployeeNumber,
                FirstName = profile.FirstName,
                MiddleName = profile.MiddleName,
                LastName = profile.LastName,
                Suffix = profile.Suffix,
                Role = profile.Account.Role,
                Start_Date = request.StartDate,
                End_Date = request.EndDate,
                Leave_Type = request.LeaveType,
                Reason = request.Reason,
                Approval_Status = leaveRequest.Approval_Status,
                LeaveRequestNote = request.LeaveRequestNote,
                SubmittedAt = leaveRequest.SubmittedAt,
                UpdatedAt = leaveRequest.UpdatedAt
            };
        }

        public async Task<bool> UpdateLeaveStatusAsync(Guid leaveId, UpdateLeaveStatusDTO request)
        {
            var leaveRequest = await context.LeaveRequests
                .FirstOrDefaultAsync(lr => lr.LeaveId == leaveId);

            if (leaveRequest == null)
                return false;

            // Get the Account
            var claimProfile = httpContextAccessor
               .HttpContext?
               .User
               .FindFirst(ClaimTypes.NameIdentifier)?
               .Value;

            if (string.IsNullOrEmpty(claimProfile))
                return false;

            var profile = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.Account.AccountId.ToString() == claimProfile);

            if (profile is null || profile.Account is null)
                return false;

            var searchFiltered = request.LeaveRequestNote.Length > 500
                ? request.LeaveRequestNote.Substring(0, 150)
                : request.LeaveRequestNote;

            leaveRequest.Approved_By = profile.Account.AccountId;
            leaveRequest.Approval_Status = request.Approval_Status;
            leaveRequest.LeaveRequestNote = request.LeaveRequestNote;

            if (request.Approval_Status == "Approved")
            {
                var employeeAccount = await context.Accounts.FirstOrDefaultAsync(a => a.AccountId == leaveRequest.AccountId);
                if (employeeAccount != null)
                {
                    employeeAccount.AccountStatus = "On Leave";
                }
            }
            else if (request.Approval_Status == "Declined" || request.Approval_Status == "Rejected")
            {
                var employeeAccount = await context.Accounts.FirstOrDefaultAsync(a => a.AccountId == leaveRequest.AccountId);
                if (employeeAccount != null && employeeAccount.AccountStatus == "On Leave")
                {
                    employeeAccount.AccountStatus = "Active";
                }
            }

            await context.SaveChangesAsync();

            // Explicitly load navigation properties to prevent NullReferenceException on activity logging
            await context.Entry(leaveRequest).Reference(lr => lr.Account).LoadAsync();
            if (leaveRequest.Account != null)
            {
                await context.Entry(leaveRequest.Account).Reference(a => a.Employee).LoadAsync();
            }
            await context.Entry(leaveRequest).Reference(lr => lr.ApprovedByAccount).LoadAsync();
            if (leaveRequest.ApprovedByAccount != null)
            {
                await context.Entry(leaveRequest.ApprovedByAccount).Reference(a => a.Employee).LoadAsync();
            }

            await activityLogService.LogActivityAsync(
                leaveRequest.ApprovedByAccount.AccountId,
                ActivityTypes.LeaveStatusUpdated,
                $"{string.Join(" ", new[]
                    {leaveRequest.ApprovedByAccount.Employee.FirstName, leaveRequest.ApprovedByAccount.Employee.MiddleName, leaveRequest.ApprovedByAccount.Employee.LastName, leaveRequest.ApprovedByAccount.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the Leave Status of {string.Join(" ", new[]
                    {leaveRequest.Account.Employee.FirstName, leaveRequest.Account.Employee.MiddleName, leaveRequest.Account.Employee.LastName, leaveRequest.Account.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} to {leaveRequest.Approval_Status} at {DateTime.Now:hh:mm tt}");

            return true;
        }
    }
}