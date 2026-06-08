using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.LeaveRequest;
using OTMS.Entities.DTOs.LeaveRequest.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;

namespace OTMS.Service.Interfaces
{
    public interface ILeaveRequest
    {
        Task<LeaveRequestResponseDTO> CreateLeaveRequestAsync(CreateLeaveRequestDTO request);
        Task<LeaveRequestResponseDTO> UpdateLeaveRequestAsync(UpdateLeaveRequestDTO request);
        Task<ApiResponseDTO<object>> DeleteLeaveRequestAsync(Guid leaveId);
        Task<PaginationResponseDTO<LeaveRequestResponseDTO>> GetAllLeaveRequestsAsync(PaginationDTO request);
        Task<PaginationResponseDTO<object>> GetMyLeaveRequestsAsync(Guid accountId, PaginationDTO pagination);
        Task<bool> UpdateLeaveStatusAsync(Guid leaveId, UpdateLeaveStatusDTO request);
        Task UpdateEmployeeAvailabilityStatusesAsync(Guid accountId);
    }
}
