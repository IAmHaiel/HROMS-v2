using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.DTOs.Recruitment;

namespace OTMS.Service.Interfaces
{
    public interface IRecruitmentService
    {
        Task<ApiResponseDTO<PaginationResponseDTO<ApplicantRecordDTO>>> GetDashboardApplicantsAsync(ApplicantDashboardFilterDTO filter);
        Task<ApiResponseDTO<string>> UpdateApplicantStatusAsync(UpdateApplicantStatusDTO request);
        Task<ApiResponseDTO<IEnumerable<ApplicantStatusHistoryDTO>>> GetApplicantStatusHistoryAsync(Guid applicantRecordId);
        Task<ApiResponseDTO<string>> ScheduleInterviewAsync(InterviewSchedulingDTO request);
    }
}
