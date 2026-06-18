using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OTMS.Common;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Recruitment;
using OTMS.Entities.Models;
using OTMS.Service.Helper;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class OnboardingService(
        OTMSDbContext context,
        IConfiguration configuration,
        INotificationService notificationService,
        IActivityLogService activityLogService,
        IHttpContextAccessor httpContextAccessor,
        IFileService fileService,
        IEmployeeNumberGenerator employeeNumberGenerator
        ) : IOnboardingService
    {
        private const int TokenExpiryHours = 72;
        private const int TokenByteLength = 64;

        public async Task<ApiResponseDTO<OnboardingLinkResponseDTO>> GenerateAndSendOnboardingLinkAsync(Guid applicantRecordId, Guid createdByAccountId)
        {
            var applicant = await context.ApplicantRecords
                .FirstOrDefaultAsync(ar => ar.ApplicantRecordId == applicantRecordId);

            if (applicant == null)
            {
                return new ApiResponseDTO<OnboardingLinkResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Applicant not found.",
                    Data = null
                };
            }

            var existingActive = await context.OnboardingTokens
                .FirstOrDefaultAsync(ot => ot.ApplicantRecordId == applicantRecordId && ot.Status == "Active");

            if (existingActive != null)
            {
                var frontendBaseUrl = configuration["FrontendBaseUrl"] ?? "http://localhost:5173";
                var existingUrl = $"{frontendBaseUrl}/onboarding?token={existingActive.OnboardingTokenId}";

                return new ApiResponseDTO<OnboardingLinkResponseDTO>
                {
                    IsSuccess = true,
                    Message = "An active onboarding link already exists.",
                    Data = new OnboardingLinkResponseDTO
                    {
                        ApplicantRecordId = applicantRecordId,
                        OnboardingUrl = existingUrl,
                        TokenStatus = existingActive.Status,
                        ExpiresAt = existingActive.ExpiresAt,
                        CreatedAt = existingActive.CreatedAt
                    }
                };
            }

            var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(TokenByteLength))
                .Replace('+', '-')
                .Replace('/', '_')
                .Replace("=", "");

            var tokenHash = ComputeSha256Hash(rawToken);

            var expiry = DateTime.UtcNow.AddHours(TokenExpiryHours);

            var onboardingToken = new OnboardingToken
            {
                OnboardingTokenId = Guid.NewGuid(),
                ApplicantRecordId = applicantRecordId,
                TokenHash = tokenHash,
                Status = "Active",
                ExpiresAt = expiry,
                CreatedAt = DateTime.UtcNow,
                CreatedByAccountId = createdByAccountId
            };

            context.OnboardingTokens.Add(onboardingToken);
            await context.SaveChangesAsync();

            var frontendBaseUrl2 = configuration["FrontendBaseUrl"] ?? "http://localhost:5173";
            var onboardingUrl = $"{frontendBaseUrl2}/onboarding?token={rawToken}";

            var subject = $"Job Offer & Onboarding – {applicant.JobPosition?.Title ?? "Position"} at Speedex";
            var body = $@"
                <h2>Congratulations! You've Been Offered the Position</h2>
                <p>Dear <strong>{applicant.FullName}</strong>,</p>
                <p>We are pleased to inform you that you have been selected for the position at Speedex. Please complete your onboarding by clicking the link below:</p>
                <p><a href='{onboardingUrl}' style='display:inline-block;padding:12px 24px;background:#4318ff;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;'>Complete Onboarding</a></p>
                <p><strong>Link:</strong> <a href='{onboardingUrl}'>{onboardingUrl}</a></p>
                <p>This link will expire in <strong>72 hours</strong> and can only be used once.</p>
                <hr>
                <p><small>This is an automated message from the Operational Task Management System.</small></p>";

            var emailSent = await notificationService.SendEmailWithStatusAsync(applicant.EmailAddress, subject, body);

            await activityLogService.LogActivityAsync(
                createdByAccountId,
                ActivityTypes.OnboardingLinkSent,
                $"Onboarding link sent to applicant '{applicant.FullName}' (Status: {(emailSent ? "Email Sent" : "Email Queued for Retry")})."
            );

            await notificationService.CreateGeneralNotificationAsync(
                createdByAccountId,
                NotificationTypes.OnboardingLinkSent,
                $"Onboarding link has been sent to applicant '{applicant.FullName}'."
            );

            return new ApiResponseDTO<OnboardingLinkResponseDTO>
            {
                IsSuccess = true,
                Message = emailSent
                    ? "Onboarding link generated and email sent successfully."
                    : "Onboarding link generated. Email dispatch failed. Retrying...",
                Data = new OnboardingLinkResponseDTO
                {
                    ApplicantRecordId = applicantRecordId,
                    OnboardingUrl = onboardingUrl,
                    TokenStatus = "Active",
                    ExpiresAt = expiry,
                    CreatedAt = onboardingToken.CreatedAt
                }
            };
        }

        public async Task<ApiResponseDTO<OnboardingValidationResponseDTO>> ValidateOnboardingTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return new ApiResponseDTO<OnboardingValidationResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Token is required.",
                    Data = null
                };
            }

            var tokenHash = ComputeSha256Hash(token);

            var onboardingToken = await context.OnboardingTokens
                .Include(ot => ot.ApplicantRecord)
                    .ThenInclude(ar => ar.JobPosition)
                .FirstOrDefaultAsync(ot => ot.TokenHash == tokenHash);

            if (onboardingToken == null)
            {
                return new ApiResponseDTO<OnboardingValidationResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Invalid or expired link.",
                    Data = null
                };
            }

            if (onboardingToken.Status != "Active")
            {
                var errorMsg = onboardingToken.Status switch
                {
                    "Used" => "This link has already been used.",
                    "Expired" => "This link has expired.",
                    _ => "Invalid or expired link."
                };
                return new ApiResponseDTO<OnboardingValidationResponseDTO>
                {
                    IsSuccess = false,
                    Message = errorMsg,
                    Data = null
                };
            }

            if (onboardingToken.ExpiresAt < DateTime.UtcNow)
            {
                onboardingToken.Status = "Expired";
                await context.SaveChangesAsync();

                return new ApiResponseDTO<OnboardingValidationResponseDTO>
                {
                    IsSuccess = false,
                    Message = "This link has expired.",
                    Data = null
                };
            }

            // Check if an employee account already exists for this applicant
            var existingEmployee = await context.Employees
                .Include(e => e.Account)
                    .ThenInclude(a => a.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(e => e.Email == onboardingToken.ApplicantRecord.EmailAddress && e.Account != null);

            if (existingEmployee != null)
            {
                var jwt = CreateToken(existingEmployee);

                return new ApiResponseDTO<OnboardingValidationResponseDTO>
                {
                    IsSuccess = true,
                    Message = "Token is valid. Existing session resumed.",
                    Data = new OnboardingValidationResponseDTO
                    {
                        AccessToken = jwt,
                        EmployeeNumber = existingEmployee.EmployeeNumber,
                        EmployeeId = existingEmployee.EmployeeId,
                        FullName = onboardingToken.ApplicantRecord.FullName,
                        FirstName = onboardingToken.ApplicantRecord.FirstName,
                        MiddleName = onboardingToken.ApplicantRecord.MiddleName,
                        LastName = onboardingToken.ApplicantRecord.LastName,
                        Suffix = onboardingToken.ApplicantRecord.Suffix,
                        ContactNumber = onboardingToken.ApplicantRecord.ContactNumber,
                        EmailAddress = onboardingToken.ApplicantRecord.EmailAddress,
                        JobPositionName = onboardingToken.ApplicantRecord.JobPosition?.Title ?? "",
                        ResumeFilePath = onboardingToken.ApplicantRecord.ResumeFilePath,
                        Gender = onboardingToken.ApplicantRecord.Gender,
                        CivilStatus = onboardingToken.ApplicantRecord.CivilStatus,
                        BirthMonth = onboardingToken.ApplicantRecord.BirthMonth,
                        BirthDay = onboardingToken.ApplicantRecord.BirthDay,
                        BirthYear = onboardingToken.ApplicantRecord.BirthYear,
                        Age = onboardingToken.ApplicantRecord.Age
                    }
                };
            }

            // First-time validation — do NOT create employee yet.
            // Just return applicant info for pre-filling the wizard.
            // Employee record will be created when onboarding is completed.
            var applicant = onboardingToken.ApplicantRecord;

            return new ApiResponseDTO<OnboardingValidationResponseDTO>
            {
                IsSuccess = true,
                Message = "Token is valid. Please complete the onboarding steps.",
                Data = new OnboardingValidationResponseDTO
                {
                    AccessToken = "",
                    EmployeeNumber = "",
                    EmployeeId = Guid.Empty,
                    FullName = applicant.FullName,
                    FirstName = applicant.FirstName,
                    MiddleName = applicant.MiddleName,
                    LastName = applicant.LastName,
                    Suffix = applicant.Suffix,
                    ContactNumber = applicant.ContactNumber,
                    EmailAddress = applicant.EmailAddress,
                    JobPositionName = applicant.JobPosition?.Title ?? "",
                    ResumeFilePath = applicant.ResumeFilePath,
                    Gender = applicant.Gender,
                    CivilStatus = applicant.CivilStatus,
                    BirthMonth = applicant.BirthMonth,
                    BirthDay = applicant.BirthDay,
                    BirthYear = applicant.BirthYear,
                    Age = applicant.Age
                }
            };
        }

        public async Task<ApiResponseDTO<string>> CompleteOnboardingAsync(string token, string? password = null, ValidateOnboardingTokenDTO? formData = null)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Token is required.",
                    Data = null
                };
            }

            var tokenHash = ComputeSha256Hash(token);

            var onboardingToken = await context.OnboardingTokens
                .Include(ot => ot.ApplicantRecord)
                .FirstOrDefaultAsync(ot => ot.TokenHash == tokenHash);

            if (onboardingToken == null)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Invalid or expired link.",
                    Data = null
                };
            }

            if (onboardingToken.Status != "Active")
            {
                var errorMsg = onboardingToken.Status switch
                {
                    "Used" => "This link has already been used.",
                    "Expired" => "This link has expired.",
                    _ => "Invalid or expired link."
                };
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = errorMsg,
                    Data = null
                };
            }

            if (onboardingToken.ExpiresAt < DateTime.UtcNow)
            {
                onboardingToken.Status = "Expired";
                await context.SaveChangesAsync();
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "This link has expired.",
                    Data = null
                };
            }

            // Create Employee and Account now (not during validation)
            var applicant = onboardingToken.ApplicantRecord;

            var employeeNumber = await employeeNumberGenerator.GenerateNextEmployeeNumberAsync();

            var defaultRoleName = configuration["AppSettings:DefaultNewHireRole"] ?? "Encoder";
            var targetRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == defaultRoleName);
            if (targetRole == null)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = $"Default role '{defaultRoleName}' not found. Please contact system administrator.",
                    Data = null
                };
            }

            var useProvidedPassword = !string.IsNullOrEmpty(password) && password.Length >= PasswordLength.MinimumLength;
            var tempPassword = useProvidedPassword ? password! : PasswordGenerator.Generate();

            var employee = new Employee
            {
                EmployeeId = Guid.NewGuid(),
                EmployeeNumber = employeeNumber,
                FirstName = applicant.FirstName,
                MiddleName = applicant.MiddleName,
                LastName = applicant.LastName,
                Suffix = applicant.Suffix,
                ContactNumber = applicant.ContactNumber,
                EmploymentStatus = "Active",
                CreatedAt = DateTime.UtcNow,
                Email = applicant.EmailAddress,
                IsEmailVerified = true,
                DepartmentId = applicant.JobPosition?.DepartmentId,
                JobPositionId = applicant.JobPositionId
            };

            var account = new Account
            {
                AccountId = Guid.NewGuid(),
                EmployeeId = employee.EmployeeId,
                RoleId = targetRole.RoleId,
                Role = targetRole,
                AccountStatus = "Active",
                CreatedAt = DateTime.UtcNow,
                IsPasswordChanged = true
            };

            account.PasswordHash = new PasswordHasher<Account>().HashPassword(account, tempPassword);
            employee.Account = account;

            context.Employees.Add(employee);
            context.Accounts.Add(account);

            onboardingToken.Status = "Used";
            onboardingToken.UsedAt = DateTime.UtcNow;

            var oldStatus = applicant.Status;
            applicant.Status = "Hired/Converted";

            // Save 201 File data to ApplicantRecord
            if (formData != null)
            {
                if (!string.IsNullOrWhiteSpace(formData.SSSNumber)) applicant.SSSNumber = formData.SSSNumber;
                if (!string.IsNullOrWhiteSpace(formData.PhilHealthNumber)) applicant.PhilHealthNumber = formData.PhilHealthNumber;
                if (!string.IsNullOrWhiteSpace(formData.PagIBIGNumber)) applicant.PagIBIGNumber = formData.PagIBIGNumber;
                if (!string.IsNullOrWhiteSpace(formData.TIN)) applicant.TIN = formData.TIN;
                if (!string.IsNullOrWhiteSpace(formData.BankName)) applicant.BankName = formData.BankName;
                if (!string.IsNullOrWhiteSpace(formData.BankAccountName)) applicant.BankAccountName = formData.BankAccountName;
                if (!string.IsNullOrWhiteSpace(formData.BankAccountNumber)) applicant.BankAccountNumber = formData.BankAccountNumber;
                if (!string.IsNullOrWhiteSpace(formData.EmergencyContactName)) applicant.EmergencyContactName = formData.EmergencyContactName;
                if (!string.IsNullOrWhiteSpace(formData.EmergencyContactRelationship)) applicant.EmergencyContactRelationship = formData.EmergencyContactRelationship;
                if (!string.IsNullOrWhiteSpace(formData.EmergencyContactMobileNumber)) applicant.EmergencyContactMobileNumber = formData.EmergencyContactMobileNumber;
                if (!string.IsNullOrWhiteSpace(formData.MotherFirstName)) applicant.MotherFirstName = formData.MotherFirstName;
                if (!string.IsNullOrWhiteSpace(formData.MotherMiddleName)) applicant.MotherMiddleName = formData.MotherMiddleName;
                if (!string.IsNullOrWhiteSpace(formData.MotherLastName)) applicant.MotherLastName = formData.MotherLastName;
                if (!string.IsNullOrWhiteSpace(formData.FatherFirstName)) applicant.FatherFirstName = formData.FatherFirstName;
                if (!string.IsNullOrWhiteSpace(formData.FatherMiddleName)) applicant.FatherMiddleName = formData.FatherMiddleName;
                if (!string.IsNullOrWhiteSpace(formData.FatherLastName)) applicant.FatherLastName = formData.FatherLastName;
                applicant.UpdatedAt = DateTime.UtcNow;
            }

            context.ApplicantStatusRecords.Add(new ApplicantStatusRecord
            {
                ApplicantStatusRecordId = Guid.NewGuid(),
                ApplicantRecordId = applicant.ApplicantRecordId,
                OldStatus = oldStatus,
                NewStatus = "Hired/Converted",
                Remarks = "Automated account conversion upon onboarding completion.",
                UpdatedById = onboardingToken.CreatedByAccountId,
                UpdatedAt = DateTime.UtcNow
            });

            await context.SaveChangesAsync();

            // Send welcome email with credentials
            var frontendBaseUrl = configuration["FrontendBaseUrl"] ?? "http://localhost:5173";
            var subject = "Your Employee Account Has Been Created";
            var body = $@"
                <h2>Welcome to the Team!</h2>
                <p>Dear <strong>{applicant.FullName}</strong>,</p>
                <p>Your employee account has been created and is now active. You can log in using the password you set during onboarding.</p>
                <p><strong>Employee Number:</strong> {employeeNumber}</p>
                <p><strong>Login URL:</strong> <a href='{frontendBaseUrl}'>{frontendBaseUrl}</a></p>
                <hr>
                <p><small>This is an automated message from the Operational Task Management System.</small></p>";

            await notificationService.SendEmailWithStatusAsync(applicant.EmailAddress, subject, body);

            await activityLogService.LogActivityAsync(
                onboardingToken.CreatedByAccountId,
                ActivityTypes.AccountProvisioned,
                $"Employee {employeeNumber} account provisioned and credentials sent to {applicant.EmailAddress}."
            );

            await activityLogService.LogActivityAsync(
                onboardingToken.CreatedByAccountId,
                ActivityTypes.OnboardingCompleted,
                $"Applicant '{applicant.FullName}' completed onboarding. Status updated to Hired/Converted."
            );

            return new ApiResponseDTO<string>
            {
                IsSuccess = true,
                Message = $"Onboarding completed successfully. Your Employee Number is {employeeNumber}.",
                Data = onboardingToken.ApplicantRecordId.ToString()
            };
        }

        public async Task<ApiResponseDTO<string>> UploadDocumentAsync(string token, string documentType, IFormFile file)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return new ApiResponseDTO<string> { IsSuccess = false, Message = "Token is required.", Data = null };
            }

            var tokenHash = ComputeSha256Hash(token);

            var onboardingToken = await context.OnboardingTokens
                .Include(ot => ot.ApplicantRecord)
                .FirstOrDefaultAsync(ot => ot.TokenHash == tokenHash);

            if (onboardingToken == null)
            {
                return new ApiResponseDTO<string> { IsSuccess = false, Message = "Invalid or expired link.", Data = null };
            }

            if (onboardingToken.Status != "Active")
            {
                var errorMsg = onboardingToken.Status switch
                {
                    "Used" => "This link has already been used.",
                    "Expired" => "This link has expired.",
                    _ => "Invalid or expired link."
                };
                return new ApiResponseDTO<string> { IsSuccess = false, Message = errorMsg, Data = null };
            }

            if (onboardingToken.ExpiresAt < DateTime.UtcNow)
            {
                onboardingToken.Status = "Expired";
                await context.SaveChangesAsync();
                return new ApiResponseDTO<string> { IsSuccess = false, Message = "This link has expired.", Data = null };
            }

            if (file == null || file.Length == 0)
            {
                return new ApiResponseDTO<string> { IsSuccess = false, Message = "No file provided.", Data = null };
            }

            if (file.Length > 10 * 1024 * 1024)
            {
                return new ApiResponseDTO<string> { IsSuccess = false, Message = "File size must not exceed 10MB.", Data = null };
            }

            var applicant = onboardingToken.ApplicantRecord;

            var folderMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "biodata", "resumes" },
                { "medical", "applicant-docs" },
                { "nbi", "applicant-docs" },
                { "psa", "applicant-docs" },
                { "bir2316", "applicant-docs" },
                { "govId", "applicant-docs" },
                { "education", "applicant-docs" },
            };

            if (!folderMap.TryGetValue(documentType, out var subfolder))
            {
                return new ApiResponseDTO<string> { IsSuccess = false, Message = $"Unknown document type: {documentType}", Data = null };
            }

            string fileUrl;
            try
            {
                fileUrl = await fileService.UploadFileAsync(file, subfolder);
            }
            catch (Exception ex)
            {
                return new ApiResponseDTO<string> { IsSuccess = false, Message = $"Failed to save file: {ex.Message}", Data = null };
            }

            switch (documentType.ToLower())
            {
                case "biodata":
                    applicant.ResumeFilePath = fileUrl;
                    break;
                case "medical":
                    applicant.MedicalClearanceFilePath = fileUrl;
                    break;
                case "nbi":
                    applicant.NBIClearanceFilePath = fileUrl;
                    break;
                case "psa":
                    applicant.PSABirthCertificateFilePath = fileUrl;
                    break;
                case "bir2316":
                    applicant.BIRForm2316FilePath = fileUrl;
                    break;
            }

            applicant.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            return new ApiResponseDTO<string>
            {
                IsSuccess = true,
                Message = "Document uploaded successfully.",
                Data = fileUrl
            };
        }

        public async Task<ApiResponseDTO<OnboardingLinkResponseDTO>> GetOnboardingLinkStatusAsync(Guid applicantRecordId)
        {
            var applicant = await context.ApplicantRecords
                .FirstOrDefaultAsync(ar => ar.ApplicantRecordId == applicantRecordId);

            if (applicant == null)
            {
                return new ApiResponseDTO<OnboardingLinkResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Applicant not found.",
                    Data = null
                };
            }

            var token = await context.OnboardingTokens
                .Where(ot => ot.ApplicantRecordId == applicantRecordId)
                .OrderByDescending(ot => ot.CreatedAt)
                .FirstOrDefaultAsync();

            if (token == null)
            {
                return new ApiResponseDTO<OnboardingLinkResponseDTO>
                {
                    IsSuccess = false,
                    Message = "No onboarding link has been generated for this applicant.",
                    Data = null
                };
            }

            return new ApiResponseDTO<OnboardingLinkResponseDTO>
            {
                IsSuccess = true,
                Message = "Onboarding link status retrieved.",
                Data = new OnboardingLinkResponseDTO
                {
                    ApplicantRecordId = applicantRecordId,
                    OnboardingUrl = "",
                    TokenStatus = token.Status,
                    ExpiresAt = token.ExpiresAt,
                    CreatedAt = token.CreatedAt
                }
            };
        }

        public async Task<ApiResponseDTO<OnboardingLinkResponseDTO>> ResendOnboardingLinkAsync(Guid applicantRecordId)
        {
            var currentAccountId = GetCurrentAccountId();
            if (currentAccountId == null)
            {
                return new ApiResponseDTO<OnboardingLinkResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Unauthorized. Please log in again.",
                    Data = null
                };
            }

            var existingTokens = await context.OnboardingTokens
                .Where(ot => ot.ApplicantRecordId == applicantRecordId && ot.Status == "Active")
                .ToListAsync();

            foreach (var t in existingTokens)
            {
                t.Status = "Expired";
            }

            await context.SaveChangesAsync();

            return await GenerateAndSendOnboardingLinkAsync(applicantRecordId, currentAccountId.Value);
        }

        private static string ComputeSha256Hash(string raw)
        {
            var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private Guid? GetCurrentAccountId()
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim) || !Guid.TryParse(accountIdClaim, out var accountId))
                return null;
            return accountId;
        }

        private string CreateToken(Employee employee)
        {
            if (employee.Account is null)
            {
                throw new InvalidOperationException(
                    "Employee does not have an associated account."
                );
            }

            var claims = new List<Claim>
            {
                new Claim(
                    ClaimTypes.Name,
                    employee.EmployeeNumber
                ),
                new Claim(
                    ClaimTypes.NameIdentifier,
                    employee.Account.AccountId.ToString()
                ),
                new Claim(
                    ClaimTypes.Role,
                    (employee.Account.Role?.Name ?? string.Empty).Replace(" ", "")
                )
            };

            if (employee.Account.Role != null && employee.Account.Role.RolePermissions != null)
            {
                foreach (var rp in employee.Account.Role.RolePermissions)
                {
                    if (rp.Permission != null)
                    {
                        claims.Add(new Claim("Permission", rp.Permission.Name));
                    }
                }
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    configuration.GetValue<string>("AppSettings:Token")!
                )
            );

            var creds = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha512
            );

            var tokenDescriptor = new JwtSecurityToken(
                issuer: configuration.GetValue<string>("AppSettings:Issuer"),
                audience: configuration.GetValue<string>("AppSettings:Audience"),
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler()
                .WriteToken(tokenDescriptor);
        }
    }
}