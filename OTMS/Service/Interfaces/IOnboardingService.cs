using Microsoft.AspNetCore.Http;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Recruitment;

namespace OTMS.Service.Interfaces
{
    public interface IOnboardingService
    {
        Task<ApiResponseDTO<OnboardingLinkResponseDTO>> GenerateAndSendOnboardingLinkAsync(Guid applicantRecordId, Guid createdByAccountId);
        Task<ApiResponseDTO<OnboardingValidationResponseDTO>> ValidateOnboardingTokenAsync(string token);
        Task<ApiResponseDTO<string>> CompleteOnboardingAsync(string token, string? password = null, ValidateOnboardingTokenDTO? formData = null);
        Task<ApiResponseDTO<string>> UploadDocumentAsync(string token, string documentType, IFormFile file);
        Task<ApiResponseDTO<string>> CompleteProfileAsync(CompleteProfileDTO formData);
        Task<ApiResponseDTO<OnboardingLinkResponseDTO>> GetOnboardingLinkStatusAsync(Guid applicantRecordId);
        Task<ApiResponseDTO<OnboardingLinkResponseDTO>> ResendOnboardingLinkAsync(Guid applicantRecordId);
    }
}