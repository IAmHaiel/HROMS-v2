using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Recruitment;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class OnboardingService(
        OTMSDbContext context,
        IConfiguration configuration,
        INotificationService notificationService,
        IActivityLogService activityLogService,
        IHttpContextAccessor httpContextAccessor
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

        public async Task<ApiResponseDTO<ApplicantRecordDTO>> ValidateOnboardingTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return new ApiResponseDTO<ApplicantRecordDTO>
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
                return new ApiResponseDTO<ApplicantRecordDTO>
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
                return new ApiResponseDTO<ApplicantRecordDTO>
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

                return new ApiResponseDTO<ApplicantRecordDTO>
                {
                    IsSuccess = false,
                    Message = "This link has expired.",
                    Data = null
                };
            }

            return new ApiResponseDTO<ApplicantRecordDTO>
            {
                IsSuccess = true,
                Message = "Token is valid.",
                Data = new ApplicantRecordDTO
                {
                    ApplicantRecordId = onboardingToken.ApplicantRecord.ApplicantRecordId,
                    FullName = onboardingToken.ApplicantRecord.FullName,
                    EmailAddress = onboardingToken.ApplicantRecord.EmailAddress,
                    ContactNumber = onboardingToken.ApplicantRecord.ContactNumber,
                    JobPositionName = onboardingToken.ApplicantRecord.JobPosition?.Title ?? "",
                    Status = onboardingToken.ApplicantRecord.Status,
                    CreatedAt = onboardingToken.ApplicantRecord.CreatedAt
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
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                onboardingToken.CreatedByAccountId,
                ActivityTypes.OnboardingCompleted,
                $"Applicant '{onboardingToken.ApplicantRecord.FullName}' completed onboarding."
            );

            return new ApiResponseDTO<string>
            {
                IsSuccess = true,
                Message = "Onboarding completed successfully.",
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
    }
}