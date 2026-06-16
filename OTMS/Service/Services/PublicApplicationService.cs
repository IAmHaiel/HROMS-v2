using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Public;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class PublicApplicationService(
        OTMSDbContext context,
        IFileService fileService,
        INotificationService notificationService,
        IGoogleTokenValidator googleTokenValidator
        ) : IPublicApplicationService
    {
        public async Task<ApiResponseDTO<IEnumerable<JobPositionDTO>>> GetActiveJobPositionsAsync()
        {
            var positions = await context.JobPositions
                .Where(jp => jp.IsActive)
                .Select(jp => new JobPositionDTO
                {
                    JobPositionId = jp.JobPositionId,
                    Title = jp.Title
                })
                .ToListAsync();

            return new ApiResponseDTO<IEnumerable<JobPositionDTO>>
            {
                IsSuccess = true,
                Message = "Active job positions retrieved successfully.",
                Data = positions
            };
        }

        public async Task<ApiResponseDTO<string>> SubmitApplicationAsync(ApplicantSubmissionDTO request)
        {
            // 1. Validate Google token
            string emailAddress;
            try
            {
                emailAddress = await googleTokenValidator.ValidateTokenAndGetEmailAsync(request.GoogleToken);
            }
            catch (Exception)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Invalid Google token provided.",
                    Data = null
                };
            }

            // 2. Validate resume file format and size
            var allowedExtensions = new[] { ".pdf", ".docx" };
            var fileExtension = Path.GetExtension(request.Resume.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Invalid file format. Only PDF and DOCX files are accepted.",
                    Data = null
                };
            }

            if (request.Resume.Length > 5 * 1024 * 1024)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "File size must not exceed 5MB.",
                    Data = null
                };
            }

            // 3. Verify job position exists and is active
            var jobPosition = await context.JobPositions
                .FirstOrDefaultAsync(jp => jp.JobPositionId == request.JobPositionId && jp.IsActive);

            if (jobPosition == null)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "The selected job position is not available.",
                    Data = null
                };
            }

            // 4. Upload resume
            string resumeFilePath;
            try
            {
                resumeFilePath = await fileService.UploadFileAsync(request.Resume, "resumes");
            }
            catch (Exception)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Failed to upload resume. Please try again.",
                    Data = null
                };
            }

            // 5. Create ApplicantRecord
            var applicantRecord = new ApplicantRecord
            {
                ApplicantRecordId = Guid.NewGuid(),
                FullName = request.FullName.Trim(),
                EmailAddress = emailAddress,
                ContactNumber = request.ContactNumber.Trim(),
                JobPositionId = request.JobPositionId,
                ResumeFilePath = resumeFilePath,
                Status = "Pending Review",
                CreatedAt = DateTime.UtcNow
            };

            context.ApplicantRecords.Add(applicantRecord);
            await context.SaveChangesAsync();

            // 6. Dispatch notification to SystemAdmin
            await DispatchApplicationNotificationAsync(applicantRecord);

            return new ApiResponseDTO<string>
            {
                IsSuccess = true,
                Message = "Application submitted successfully.",
                Data = applicantRecord.ApplicantRecordId.ToString()
            };
        }

        private async System.Threading.Tasks.Task DispatchApplicationNotificationAsync(ApplicantRecord applicant)
        {
            var sysAdmin = await context.Accounts
                .Include(a => a.Employee)
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Role != null && a.Role.Name == Roles.SystemAdmin);

            if (sysAdmin == null) return;

            var notificationMessage = $"A new job application has been submitted by {applicant.FullName} ({applicant.EmailAddress}) for position {applicant.JobPosition.Title}. Status: {applicant.Status}.";

            await notificationService.CreateGeneralNotificationAsync(
                sysAdmin.AccountId,
                NotificationTypes.ApplicationSubmitted,
                notificationMessage
            );
        }
    }
}
