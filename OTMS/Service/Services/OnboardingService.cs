using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
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
                        EmailAddress = onboardingToken.ApplicantRecord.EmailAddress,
                        JobPositionName = onboardingToken.ApplicantRecord.JobPosition?.Title ?? ""
                    }
                };
            }

            // First-time validation — provision employee account
            var applicant = onboardingToken.ApplicantRecord;

            var employeeNumber = await employeeNumberGenerator.GenerateNextEmployeeNumberAsync();

            var defaultRoleName = configuration["AppSettings:DefaultNewHireRole"] ?? "Coordinator";
            var targetRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == defaultRoleName);
            if (targetRole == null)
            {
                return new ApiResponseDTO<OnboardingValidationResponseDTO>
                {
                    IsSuccess = false,
                    Message = $"Default role '{defaultRoleName}' not found. Please contact system administrator.",
                    Data = null
                };
            }

            var tempPassword = PasswordGenerator.Generate();

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
                IsPasswordChanged = false
            };

            account.PasswordHash = new PasswordHasher<Account>().HashPassword(account, tempPassword);
            employee.Account = account;

            context.Employees.Add(employee);
            context.Accounts.Add(account);
            await context.SaveChangesAsync();

            // Reload with role + permissions for JWT
            var provisionedEmployee = await context.Employees
                .Include(e => e.Account)
                    .ThenInclude(a => a.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                .FirstAsync(e => e.EmployeeId == employee.EmployeeId);

            var accessToken = CreateToken(provisionedEmployee);

            await activityLogService.LogActivityAsync(
                onboardingToken.CreatedByAccountId,
                ActivityTypes.AccountProvisioned,
                $"Automated provisioning: Employee {employeeNumber} created from applicant '{applicant.FullName}' (Role: {targetRole.Name}). Temporary password generated (blind)."
            );

            return new ApiResponseDTO<OnboardingValidationResponseDTO>
            {
                IsSuccess = true,
                Message = "Onboarding access granted. Employee account provisioned.",
                Data = new OnboardingValidationResponseDTO
                {
                    AccessToken = accessToken,
                    EmployeeNumber = employeeNumber,
                    EmployeeId = employee.EmployeeId,
                    FullName = applicant.FullName,
                    EmailAddress = applicant.EmailAddress,
                    JobPositionName = applicant.JobPosition?.Title ?? ""
                }
            };
        }

        public async Task<ApiResponseDTO<string>> CompleteOnboardingAsync(string token)
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

            onboardingToken.Status = "Used";
            onboardingToken.UsedAt = DateTime.UtcNow;

            // Update applicant status to Hired/Converted
            var applicant = onboardingToken.ApplicantRecord;
            var oldStatus = applicant.Status;
            applicant.Status = "Hired/Converted";

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

            // Find the provisioned employee to send credentials email
            var provisionedEmployee = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.Email == applicant.EmailAddress && e.Account != null);

            if (provisionedEmployee != null)
            {
                var frontendBaseUrl = configuration["FrontendBaseUrl"] ?? "http://localhost:5173";
                var subject = "Your Employee Account Has Been Created";
                var body = $@"
                    <h2>Welcome to the Team!</h2>
                    <p>Dear <strong>{applicant.FullName}</strong>,</p>
                    <p>Your employee account has been created. You can now log in with the temporary password that was set during the onboarding process.</p>
                    <p><strong>Employee Number:</strong> {provisionedEmployee.EmployeeNumber}</p>
                    <p><strong>Login URL:</strong> <a href='{frontendBaseUrl}'>{frontendBaseUrl}</a></p>
                    <p>Please change your password after your first login.</p>
                    <hr>
                    <p><small>This is an automated message from the Operational Task Management System.</small></p>";

                await notificationService.SendEmailWithStatusAsync(applicant.EmailAddress, subject, body);

                await activityLogService.LogActivityAsync(
                    onboardingToken.CreatedByAccountId,
                    ActivityTypes.AccountProvisioned,
                    $"Employee {provisionedEmployee.EmployeeNumber} account provisioned and credentials sent to {applicant.EmailAddress}."
                );
            }

            await activityLogService.LogActivityAsync(
                onboardingToken.CreatedByAccountId,
                ActivityTypes.OnboardingCompleted,
                $"Applicant '{onboardingToken.ApplicantRecord.FullName}' completed onboarding. Status updated to Hired/Converted."
            );

            return new ApiResponseDTO<string>
            {
                IsSuccess = true,
                Message = "Onboarding completed successfully. Employee account has been activated.",
                Data = onboardingToken.ApplicantRecordId.ToString()
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