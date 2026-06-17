using System.Security.Cryptography;
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
        IGoogleTokenValidator googleTokenValidator,
        IConfiguration configuration
        ) : IPublicApplicationService
    {
        private static readonly string[] AllowedDocExtensions = { ".pdf", ".docx" };
        private const int MaxFileSize = 5 * 1024 * 1024; // 5 MB

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
                    Message = "Authentication failed. Please log in using a valid Gmail account.",
                    Data = null
                };
            }

            // 2. Validate file formats and sizes
            var fileValidationError = ValidateUploadedFiles(request);
            if (fileValidationError != null)
                return fileValidationError;

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

            // 4. Upload all files
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

            string? nbiPath = null;
            if (request.NBIClearance != null)
            {
                try { nbiPath = await fileService.UploadFileAsync(request.NBIClearance, "applicant-docs"); }
                catch { /* optional file, continue */ }
            }

            string? medicalPath = null;
            if (request.MedicalClearance != null)
            {
                try { medicalPath = await fileService.UploadFileAsync(request.MedicalClearance, "applicant-docs"); }
                catch { /* optional file, continue */ }
            }

            string? psaPath = null;
            if (request.PSABirthCertificate != null)
            {
                try { psaPath = await fileService.UploadFileAsync(request.PSABirthCertificate, "applicant-docs"); }
                catch { /* optional file, continue */ }
            }

            string? contractPath = null;
            if (request.SignedEmploymentContract != null)
            {
                try { contractPath = await fileService.UploadFileAsync(request.SignedEmploymentContract, "applicant-docs"); }
                catch { /* optional file, continue */ }
            }

            // 5. Generate email verification token
            var verificationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(16));
            var fullName = BuildFullName(request.FirstName, request.MiddleName, request.LastName, request.Suffix);

            // 6. Create ApplicantRecord
            var applicantRecord = new ApplicantRecord
            {
                ApplicantRecordId = Guid.NewGuid(),
                FirstName = request.FirstName.Trim(),
                MiddleName = request.MiddleName?.Trim(),
                LastName = request.LastName.Trim(),
                Suffix = request.Suffix?.Trim(),
                FullName = fullName,
                Gender = request.Gender.Trim(),
                CivilStatus = request.CivilStatus.Trim(),
                EmailAddress = emailAddress,
                ContactNumber = request.ContactNumber.Trim(),
                CurrentResidentialAddress = request.CurrentResidentialAddress.Trim(),
                PermanentAddress = request.PermanentAddress.Trim(),
                SSSNumber = request.SSSNumber?.Trim(),
                PhilHealthNumber = request.PhilHealthNumber?.Trim(),
                PagIBIGNumber = request.PagIBIGNumber?.Trim(),
                TIN = request.TIN?.Trim(),
                BankName = request.BankName?.Trim(),
                BankAccountName = request.BankAccountName?.Trim(),
                BankAccountNumber = request.BankAccountNumber?.Trim(),
                NBIClearanceFilePath = nbiPath,
                MedicalClearanceFilePath = medicalPath,
                PSABirthCertificateFilePath = psaPath,
                ResumeFilePath = resumeFilePath,
                SignedEmploymentContractFilePath = contractPath,
                EmergencyContactName = request.EmergencyContactName.Trim(),
                EmergencyContactRelationship = request.EmergencyContactRelationship.Trim(),
                EmergencyContactMobileNumber = request.EmergencyContactMobileNumber.Trim(),
                DeclaredDependents = request.DeclaredDependents?.Trim(),
                HighestEducationalAttainment = request.HighestEducationalAttainment.Trim(),
                InstitutionAndYearGraduated = request.InstitutionAndYearGraduated.Trim(),
                ProfessionalLicensesCertifications = request.ProfessionalLicensesCertifications?.Trim(),
                JobPositionId = request.JobPositionId,
                Status = "Pending Review",
                IsEmailVerified = false,
                EmailVerificationToken = verificationToken,
                EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow
            };

            context.ApplicantRecords.Add(applicantRecord);
            await context.SaveChangesAsync();

            // 7. Send verification email
            await SendVerificationEmailAsync(applicantRecord);

            // 8. Dispatch notification to SystemAdmin / HRAdmin
            await DispatchApplicationNotificationAsync(applicantRecord);

            return new ApiResponseDTO<string>
            {
                IsSuccess = true,
                Message = "Application submitted successfully. Thank you for applying.",
                Data = applicantRecord.ApplicantRecordId.ToString()
            };
        }

        public async Task<ApiResponseDTO<string>> VerifyEmailAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Verification token is required.",
                    Data = null
                };
            }

            var applicant = await context.ApplicantRecords
                .FirstOrDefaultAsync(ar => ar.EmailVerificationToken == token);

            if (applicant == null)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Invalid verification token.",
                    Data = null
                };
            }

            if (applicant.IsEmailVerified)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = true,
                    Message = "Email is already verified.",
                    Data = null
                };
            }

            if (applicant.EmailVerificationTokenExpiry < DateTime.UtcNow)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Verification token has expired. Please request a new verification email.",
                    Data = null
                };
            }

            applicant.IsEmailVerified = true;
            applicant.EmailVerificationToken = null;
            applicant.EmailVerificationTokenExpiry = null;
            await context.SaveChangesAsync();

            // Notify admins about verified application
            var adminAccounts = await context.Accounts
                .Include(a => a.Role)
                .Where(a => a.Role != null && (a.Role.Name == Roles.SystemAdmin || a.Role.Name == Roles.HRAdmin))
                .ToListAsync();

            foreach (var admin in adminAccounts)
            {
                await notificationService.CreateGeneralNotificationAsync(
                    admin.AccountId,
                    NotificationTypes.ApplicationEmailVerified,
                    $"Applicant '{applicant.FullName}' ({applicant.EmailAddress}) has verified their email address."
                );
            }

            return new ApiResponseDTO<string>
            {
                IsSuccess = true,
                Message = "Email verified successfully.",
                Data = null
            };
        }

        // ─── Private Helpers ─────────────────────────────────────────────

        private ApiResponseDTO<string>? ValidateUploadedFiles(ApplicantSubmissionDTO request)
        {
            // Resume (Required)
            var resumeExt = Path.GetExtension(request.Resume.FileName).ToLowerInvariant();
            if (!AllowedDocExtensions.Contains(resumeExt))
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Invalid file format for Resume. Please upload a PDF or DOCX file.",
                    Data = null
                };
            }
            if (request.Resume.Length > MaxFileSize)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Resume file size must not exceed 5MB.",
                    Data = null
                };
            }

            // NBI Clearance (optional)
            if (request.NBIClearance != null)
            {
                var ext = Path.GetExtension(request.NBIClearance.FileName).ToLowerInvariant();
                if (!AllowedDocExtensions.Contains(ext))
                    return new ApiResponseDTO<string> { IsSuccess = false, Message = "Invalid file format for NBI Clearance. Please upload a PDF or DOCX file.", Data = null };
                if (request.NBIClearance.Length > MaxFileSize)
                    return new ApiResponseDTO<string> { IsSuccess = false, Message = "NBI Clearance file size must not exceed 5MB.", Data = null };
            }

            // Medical Clearance (optional)
            if (request.MedicalClearance != null)
            {
                var ext = Path.GetExtension(request.MedicalClearance.FileName).ToLowerInvariant();
                if (!AllowedDocExtensions.Contains(ext))
                    return new ApiResponseDTO<string> { IsSuccess = false, Message = "Invalid file format for Medical Clearance. Please upload a PDF or DOCX file.", Data = null };
                if (request.MedicalClearance.Length > MaxFileSize)
                    return new ApiResponseDTO<string> { IsSuccess = false, Message = "Medical Clearance file size must not exceed 5MB.", Data = null };
            }

            // PSA Birth Certificate (optional)
            if (request.PSABirthCertificate != null)
            {
                var ext = Path.GetExtension(request.PSABirthCertificate.FileName).ToLowerInvariant();
                if (!AllowedDocExtensions.Contains(ext))
                    return new ApiResponseDTO<string> { IsSuccess = false, Message = "Invalid file format for PSA Birth Certificate. Please upload a PDF or DOCX file.", Data = null };
                if (request.PSABirthCertificate.Length > MaxFileSize)
                    return new ApiResponseDTO<string> { IsSuccess = false, Message = "PSA Birth Certificate file size must not exceed 5MB.", Data = null };
            }

            // Signed Employment Contract (optional)
            if (request.SignedEmploymentContract != null)
            {
                var ext = Path.GetExtension(request.SignedEmploymentContract.FileName).ToLowerInvariant();
                if (!AllowedDocExtensions.Contains(ext))
                    return new ApiResponseDTO<string> { IsSuccess = false, Message = "Invalid file format for Employment Contract. Please upload a PDF or DOCX file.", Data = null };
                if (request.SignedEmploymentContract.Length > MaxFileSize)
                    return new ApiResponseDTO<string> { IsSuccess = false, Message = "Employment Contract file size must not exceed 5MB.", Data = null };
            }

            return null;
        }

        private async System.Threading.Tasks.Task SendVerificationEmailAsync(ApplicantRecord applicant)
        {
            var frontendBaseUrl = configuration["FrontendBaseUrl"] ?? "http://localhost:5173";
            var verificationLink = $"{frontendBaseUrl}/applicant/verify-email?token={applicant.EmailVerificationToken}";

            var subject = "Verify your email address – Job Application";
            var body = $@"
                <h2>Thank you for your application!</h2>
                <p>Dear <strong>{applicant.FullName}</strong>,</p>
                <p>Please verify your email address by clicking the link below to complete your job application submission:</p>
                <p><a href='{verificationLink}' style='display:inline-block;padding:12px 24px;background:#4318ff;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;'>Verify Email</a></p>
                <p><strong>Link:</strong> <a href='{verificationLink}'>{verificationLink}</a></p>
                <p>This link will expire in <strong>24 hours</strong>.</p>
                <p>If you did not submit this application, please ignore this email.</p>
                <hr>
                <p><small>This is an automated message from the Operational Task Management System.</small></p>";

            await notificationService.SendEmailWithStatusAsync(applicant.EmailAddress, subject, body);
        }

        private async System.Threading.Tasks.Task DispatchApplicationNotificationAsync(ApplicantRecord applicant)
        {
            var adminAccounts = await context.Accounts
                .Include(a => a.Employee)
                .Include(a => a.Role)
                .Where(a => a.Role != null && (a.Role.Name == Roles.SystemAdmin || a.Role.Name == Roles.HRAdmin))
                .ToListAsync();

            if (adminAccounts.Count == 0) return;

            var notificationMessage = $"A new job application has been submitted by {applicant.FullName} ({applicant.EmailAddress}) for position {applicant.JobPosition.Title}. Status: {applicant.Status}.";

            foreach (var admin in adminAccounts)
            {
                await notificationService.CreateGeneralNotificationAsync(
                    admin.AccountId,
                    NotificationTypes.ApplicationSubmitted,
                    notificationMessage
                );
            }
        }

        private static string BuildFullName(string firstName, string? middleName, string lastName, string? suffix)
        {
            var parts = new[] { firstName, middleName, lastName, suffix }
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .ToArray();
            return string.Join(" ", parts);
        }
    }
}
