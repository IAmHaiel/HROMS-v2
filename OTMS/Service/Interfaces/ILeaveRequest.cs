using OTMS.Entities.Models;

namespace OTMS.Service.Interfaces
{
    public interface ILeaveRequest
    {
        Task<LeaveRequest> CreateLeaveRequestAsync
    }
}
