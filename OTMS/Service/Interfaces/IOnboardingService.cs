using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Recruitment;

namespace OTMS.Service.Interfaces
{
    public interface IOnboardingService
    {
        Task<ApiResponseDTO<OnboardingLinkResponseDTO>> GenerateAndSendOnboardingLinkAsync(Guid applicantRecordId, Guid createdByAccountId);
        Task<ApiResponseDTO<ApplicantRecordDTO>> ValidateOnboardingTokenAsync(string token);
        Task<ApiResponseDTO<string>> CompleteOnboardingAsync(string token);
        Task<ApiResponseDTO<OnboardingLinkResponseDTO>> GetOnboardingLinkStatusAsync(Guid applicantRecordId);
        Task<ApiResponseDTO<OnboardingLinkResponseDTO>> ResendOnboardingLinkAsync(Guid applicantRecordId);
    }
}