using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Public;

namespace OTMS.Service.Interfaces
{
    public interface IPublicApplicationService
    {
        Task<ApiResponseDTO<string>> SubmitApplicationAsync(ApplicantSubmissionDTO request);
        Task<ApiResponseDTO<IEnumerable<JobPositionDTO>>> GetActiveJobPositionsAsync();
        Task<ApiResponseDTO<string>> VerifyEmailAsync(string token);
    }
}
