using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.DTOs.Recruitment;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Service.Services
{
    public class RecruitmentService(
        OTMSDbContext context,
        IHttpContextAccessor httpContextAccessor,
        IActivityLogService activityLogService,
        INotificationService notificationService
        ) : IRecruitmentService
    {
        private static readonly string[] AllowedStatuses = { "Pending Review", "Interview Scheduled", "Job Offered", "Rejected" };

        private static readonly Dictionary<string, string[]> ValidTransitions = new()
        {
            { "Pending Review", new[] { "Interview Scheduled", "Rejected" } },
            { "Interview Scheduled", new[] { "Job Offered", "Rejected" } },
            { "Job Offered", new[] { "Rejected" } },
            { "Rejected", Array.Empty<string>() }
        };

        public async Task<ApiResponseDTO<PaginationResponseDTO<ApplicantRecordDTO>>> GetDashboardApplicantsAsync(ApplicantDashboardFilterDTO filter)
        {
            var query = context.ApplicantRecords
                .Include(ar => ar.JobPosition)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.CurrentStatus))
            {
                query = query.Where(ar => ar.Status == filter.CurrentStatus);
            }

            if (filter.JobPositionId.HasValue)
            {
                query = query.Where(ar => ar.JobPositionId == filter.JobPositionId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var q = filter.Search.ToLower();
                query = query.Where(ar => ar.FullName.ToLower().Contains(q)
                    || ar.EmailAddress.ToLower().Contains(q));
            }

            var totalRecords = await query.CountAsync();

            var data = await query
                .OrderByDescending(ar => ar.CreatedAt)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(ar => new ApplicantRecordDTO
                {
                    ApplicantRecordId = ar.ApplicantRecordId,
                    FullName = ar.FullName,
                    EmailAddress = ar.EmailAddress,
                    ContactNumber = ar.ContactNumber,
                    JobPositionName = ar.JobPosition.Title,
                    Status = ar.Status,
                    CreatedAt = ar.CreatedAt
                })
                .ToListAsync();

            var totalPages = (int)Math.Ceiling(totalRecords / (double)filter.PageSize);

            return new ApiResponseDTO<PaginationResponseDTO<ApplicantRecordDTO>>
            {
                IsSuccess = true,
                Message = "Applicants retrieved successfully.",
                Data = new PaginationResponseDTO<ApplicantRecordDTO>
                {
                    IsSuccess = true,
                    Message = "Applicants retrieved successfully.",
                    Data = data,
                    PageNumber = filter.PageNumber,
                    PageSize = filter.PageSize,
                    TotalRecords = totalRecords,
                    TotalPages = totalPages
                }
            };
        }

        public async Task<ApiResponseDTO<string>> UpdateApplicantStatusAsync(UpdateApplicantStatusDTO request)
        {
            var currentAccountId = GetCurrentAccountId();
            if (currentAccountId == null)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Unauthorized. Please log in again.",
                    Data = null
                };
            }

            var applicant = await context.ApplicantRecords
                .Include(ar => ar.JobPosition)
                .FirstOrDefaultAsync(ar => ar.ApplicantRecordId == request.ApplicantRecordId);

            if (applicant == null)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Applicant not found.",
                    Data = null
                };
            }

            if (!AllowedStatuses.Contains(request.NewStatus))
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = $"Invalid status '{request.NewStatus}'. Allowed values: {string.Join(", ", AllowedStatuses)}.",
                    Data = null
                };
            }

            if (!ValidTransitions.TryGetValue(applicant.Status, out var allowed) || !allowed.Contains(request.NewStatus))
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = $"Cannot transition from '{applicant.Status}' to '{request.NewStatus}'. Allowed transitions: {(allowed?.Length > 0 ? string.Join(", ", allowed) : "none")}.",
                    Data = null
                };
            }

            var oldStatus = applicant.Status;

            var statusRecord = new ApplicantStatusRecord
            {
                ApplicantStatusRecordId = Guid.NewGuid(),
                ApplicantRecordId = applicant.ApplicantRecordId,
                OldStatus = oldStatus,
                NewStatus = request.NewStatus,
                Remarks = request.Remarks,
                UpdatedById = currentAccountId.Value,
                UpdatedAt = DateTime.UtcNow
            };

            context.ApplicantStatusRecords.Add(statusRecord);
            applicant.Status = request.NewStatus;

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                currentAccountId.Value,
                ActivityTypes.RecruitmentStatusUpdated,
                $"Updated applicant '{applicant.FullName}' status from '{oldStatus}' to '{request.NewStatus}'."
            );

            await DispatchStatusUpdateNotificationAsync(applicant, oldStatus);

            return new ApiResponseDTO<string>
            {
                IsSuccess = true,
                Message = $"Applicant status updated to '{request.NewStatus}'.",
                Data = applicant.ApplicantRecordId.ToString()
            };
        }

        public async Task<ApiResponseDTO<IEnumerable<ApplicantStatusHistoryDTO>>> GetApplicantStatusHistoryAsync(Guid applicantRecordId)
        {
            var exists = await context.ApplicantRecords.AnyAsync(ar => ar.ApplicantRecordId == applicantRecordId);
            if (!exists)
            {
                return new ApiResponseDTO<IEnumerable<ApplicantStatusHistoryDTO>>
                {
                    IsSuccess = false,
                    Message = "Applicant not found.",
                    Data = null
                };
            }

            var history = await context.ApplicantStatusRecords
                .Where(asr => asr.ApplicantRecordId == applicantRecordId)
                .Include(asr => asr.Updater)
                    .ThenInclude(u => u.Employee)
                .OrderByDescending(asr => asr.UpdatedAt)
                .Select(asr => new ApplicantStatusHistoryDTO
                {
                    OldStatus = asr.OldStatus,
                    NewStatus = asr.NewStatus,
                    Remarks = asr.Remarks,
                    UpdatedBy = asr.Updater.Employee.FirstName + " " + asr.Updater.Employee.LastName,
                    UpdatedAt = asr.UpdatedAt
                })
                .ToListAsync();

            return new ApiResponseDTO<IEnumerable<ApplicantStatusHistoryDTO>>
            {
                IsSuccess = true,
                Message = "Status history retrieved successfully.",
                Data = history
            };
        }

        private Guid? GetCurrentAccountId()
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim) || !Guid.TryParse(accountIdClaim, out var accountId))
                return null;
            return accountId;
        }

        private async System.Threading.Tasks.Task DispatchStatusUpdateNotificationAsync(ApplicantRecord applicant, string oldStatus)
        {
            var sysAdmin = await context.Accounts
                .Include(a => a.Employee)
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Role != null && a.Role.Name == Roles.SystemAdmin);

            if (sysAdmin == null) return;

            var message = $"Applicant '{applicant.FullName}' status changed from '{oldStatus}' to '{applicant.Status}'.";

            await notificationService.CreateGeneralNotificationAsync(
                sysAdmin.AccountId,
                NotificationTypes.ApplicantStatusUpdated,
                message
            );
        }
    }
}
