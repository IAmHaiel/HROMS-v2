using OTMS.Entities.DTOs.ActivityLogs;
using OTMS.Entities.DTOs.ActivityLogs.Responses;

namespace OTMS.Service.Interfaces
{
    public interface IActivityLogService
    {
        Task<ActivityLogResponseDTO> LogActivityAsync(Guid AccountId, string ActivityType, string Description);
        Task<PresenceResponseDTO> GetPresenceAsync(Guid employeeId);
    }
}
