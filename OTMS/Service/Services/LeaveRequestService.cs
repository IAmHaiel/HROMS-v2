using OTMS.Data;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class LeaveRequestService (
        OTMSDbContext context,
        IHttpContextAccessor httpContextAccessor
        ) : ILeaveRequest
    {
    }
}
