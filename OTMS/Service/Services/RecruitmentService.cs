using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.DTOs.Recruitment;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class RecruitmentService(
        OTMSDbContext context,
        IHttpContextAccessor httpContextAccessor,
        IActivityLogService activityLogService,
        INotificationService notificationService,
        IOnboardingService onboardingService
        ) : IRecruitmentService
    {
        private static readonly string[] AllowedStatuses = { "Pending Review", "Interview Scheduled", "Job Offered", "Rejected", "Hired" };

        private static readonly Dictionary<string, string[]> ValidTransitions = new()
        {
            { "Pending Review", new[] { "Interview Scheduled", "Rejected" } },
            { "Interview Scheduled", new[] { "Job Offered", "Rejected" } },
            { "Job Offered", new[] { "Rejected", "Hired" } },
            { "Rejected", Array.Empty<string>() },
            { "Hired", Array.Empty<string>() }
        };

        public async Task<ApiResponseDTO<PaginationResponseDTO<ApplicantRecordDTO>>> GetDashboardApplicantsAsync(ApplicantDashboardFilterDTO filter)
        {
            var query = context.ApplicantRecords
                .Include(ar => ar.JobPosition)
                .Include(ar => ar.StatusHistory)
                    .ThenInclude(sh => sh.Updater)
                        .ThenInclude(u => u.Employee)
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
                    ReferenceNumber = ar.ReferenceNumber,
                    FullName = ar.FullName,
                    FirstName = ar.FirstName,
                    MiddleName = ar.MiddleName,
                    LastName = ar.LastName,
                    Suffix = ar.Suffix,
                    Gender = ar.Gender,
                    CivilStatus = ar.CivilStatus,
                    BirthMonth = ar.BirthMonth,
                    BirthDay = ar.BirthDay,
                    BirthYear = ar.BirthYear,
                    Age = ar.Age,
                    Nationality = ar.Nationality,
                    Citizenship = ar.Citizenship,
                    EmailAddress = ar.EmailAddress,
                    ContactNumber = ar.ContactNumber,
                    CurrentResidentialAddress = ar.CurrentResidentialAddress,
                    PermanentAddress = ar.PermanentAddress,
                    ResumeFilePath = ar.ResumeFilePath,
                    SSSNumber = ar.SSSNumber,
                    PhilHealthNumber = ar.PhilHealthNumber,
                    PagIBIGNumber = ar.PagIBIGNumber,
                    TIN = ar.TIN,
                    BankName = ar.BankName,
                    BankAccountName = ar.BankAccountName,
                    BankAccountNumber = ar.BankAccountNumber,
                    NBIClearanceFilePath = ar.NBIClearanceFilePath,
                    MedicalClearanceFilePath = ar.MedicalClearanceFilePath,
                    PSABirthCertificateFilePath = ar.PSABirthCertificateFilePath,
                    EmergencyContactName = ar.EmergencyContactName,
                    EmergencyContactRelationship = ar.EmergencyContactRelationship,
                    EmergencyContactMobileNumber = ar.EmergencyContactMobileNumber,
                    DeclaredDependents = ar.DeclaredDependents,
                    HighestEducationalAttainment = ar.HighestEducationalAttainment,
                    Institution = ar.Institution,
                    Degree = ar.Degree,
                    YearGraduated = ar.YearGraduated,
                    ProfessionalLicensesCertifications = ar.ProfessionalLicensesCertifications,
                    IsEmailVerified = ar.IsEmailVerified,
                    JobPositionName = ar.JobPosition.Title,
                    Status = ar.Status,
                    CreatedAt = ar.CreatedAt,
                    UpdatedAt = ar.UpdatedAt,
                    AdminRemarks = ar.StatusHistory
                        .OrderByDescending(sh => sh.UpdatedAt)
                        .Select(sh => sh.Remarks)
                        .FirstOrDefault() ?? string.Empty,
                    StatusHistory = ar.StatusHistory
                        .OrderByDescending(sh => sh.UpdatedAt)
                        .Select(sh => new ApplicantStatusHistoryItem
                        {
                            Status = sh.NewStatus,
                            ChangedAt = sh.UpdatedAt,
                            ChangedBy = sh.Updater != null ? sh.Updater.Employee.FirstName + " " + sh.Updater.Employee.LastName : "System",
                            Remarks = sh.Remarks
                        })
                        .ToList()
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
            applicant.UpdatedAt = DateTime.UtcNow;

            // Expire any active onboarding tokens if status is no longer "Job Offered" or becomes "Rejected"
            if (request.NewStatus == "Rejected" || oldStatus == "Job Offered")
            {
                var activeTokens = await context.OnboardingTokens
                    .Where(ot => ot.ApplicantRecordId == applicant.ApplicantRecordId && ot.Status == "Active")
                    .ToListAsync();
                foreach (var t in activeTokens)
                {
                    t.Status = "Expired";
                }
            }

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                currentAccountId.Value,
                ActivityTypes.RecruitmentStatusUpdated,
                $"Updated applicant '{applicant.FullName}' status from '{oldStatus}' to '{request.NewStatus}'."
            );

            await DispatchStatusUpdateNotificationAsync(applicant, oldStatus);

            if (request.NewStatus == "Job Offered")
            {
                await onboardingService.GenerateAndSendOnboardingLinkAsync(
                    applicant.ApplicantRecordId, currentAccountId.Value);
            }

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

        public async Task<ApiResponseDTO<string>> ScheduleInterviewAsync(InterviewSchedulingDTO request)
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

            if (request.InterviewDate.Date <= DateTime.UtcNow.Date)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Interview date must be in the future.",
                    Data = null
                };
            }

            var interviewSchedule = new InterviewSchedule
            {
                InterviewScheduleId = Guid.NewGuid(),
                ApplicantRecordId = request.ApplicantRecordId,
                InterviewDate = request.InterviewDate,
                InterviewTime = request.InterviewTime,
                LocationOrLink = request.LocationOrLink,
                InterviewerName = string.Empty,
                CreatedAt = DateTime.UtcNow
            };

            var formattedTime = DateTime.TryParse(request.InterviewTime, out var parsedTime) ? parsedTime.ToString("hh:mm tt") : request.InterviewTime;
            var formattedDate = request.InterviewDate.ToString("dddd, MMMM dd, yyyy");
            var subject = $"Interview Schedule – {applicant.JobPosition.Title} at Speedex";
            var body = $@"
                <p>Dear <strong>{applicant.FullName}</strong>,</p>
                <p>We are pleased to inform you that you have been shortlisted for the position of <strong>{applicant.JobPosition.Title}</strong>.</p>
                <p>Your interview has been scheduled as follows:</p>
                <ul>
                    <li><strong>Date & Time:</strong> {formattedDate} at {formattedTime}</li>
                    <li><strong>Location / Meeting Link:</strong> {request.LocationOrLink}</li>
    
                </ul>
                <p>Please confirm your availability by replying to this email. If you need to reschedule, kindly notify us at least 24 hours in advance.</p>
                <p>We look forward to speaking with you.</p>
                <p><strong>Best regards,</strong><br />Recruitment Team</p>";

            var emailSent = await notificationService.SendEmailWithStatusAsync(applicant.EmailAddress, subject, body);

            // Only save interview and update status if email was sent
            if (!emailSent)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Failed to send interview email. Please check the email configuration and try again.",
                    Data = null
                };
            }

            context.InterviewSchedules.Add(interviewSchedule);

            // Expire any active onboarding tokens
            var activeTokens = await context.OnboardingTokens
                .Where(ot => ot.ApplicantRecordId == applicant.ApplicantRecordId && ot.Status == "Active")
                .ToListAsync();
            foreach (var t in activeTokens) { t.Status = "Expired"; }

            // Update applicant status to Interview Scheduled
            var oldStatus = applicant.Status;
            applicant.Status = "Interview Scheduled";
            applicant.UpdatedAt = DateTime.UtcNow;
            context.ApplicantStatusRecords.Add(new ApplicantStatusRecord
            {
                ApplicantStatusRecordId = Guid.NewGuid(),
                ApplicantRecordId = applicant.ApplicantRecordId,
                OldStatus = oldStatus,
                NewStatus = "Interview Scheduled",
                Remarks = string.IsNullOrWhiteSpace(request.Remarks) ? "Interview scheduled and email sent." : request.Remarks.Trim(),
                UpdatedById = currentAccountId.Value,
                UpdatedAt = DateTime.UtcNow
            });

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                currentAccountId.Value,
                ActivityTypes.RecruitmentStatusUpdated,
                $"Scheduled interview for applicant '{applicant.FullName}' on {request.InterviewDate:MM/dd/yyyy}."
            );

            return new ApiResponseDTO<string>
            {
                IsSuccess = true,
                Message = "Interview scheduled and email sent successfully.",
                Data = interviewSchedule.InterviewScheduleId.ToString()
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
