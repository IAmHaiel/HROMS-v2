using OTMS.Entities.DTOs.LeaveRequest;
using OTMS.Entities.DTOs.LeaveRequest.Responses;

namespace OTMS.Service.Interfaces
{
    public interface ILeaveRequest
    {
        Task<LeaveRequestResponseDTO> CreateLeaveRequestAsync(CreateLeaveRequestDTO request);
        Task<List<LeaveRequestResponseDTO>> GetAllLeaveRequestsAsync();
        Task<IEnumerable<object>> GetMyLeaveRequestsAsync(Guid accountId);
        Task<bool> UpdateLeaveStatusAsync(Guid leaveId, UpdateLeaveStatusDTO request);
        Task UpdateEmployeeAvailabilityStatusesAsync(Guid accountId);
    }
}
