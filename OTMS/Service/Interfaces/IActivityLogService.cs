using OTMS.Entities.DTOs.ActivityLogs;
using OTMS.Entities.DTOs.ActivityLogs.Responses;

namespace OTMS.Service.Interfaces
{
    public interface IActivityLogService
    {
        Task<ActivityLogResponseDTO> LogActivityAsync(Guid AccountId, string ActivityType, string Description);
        Task<PresenceResponseDTO> GetPresenceAsync(Guid employeeId);
        Task<string> GetOnlineActivityAsync(Guid employeeId);
        Task<IEnumerable<object>> GetRecentActivityLogsAsync(int count = 50);
        Task<object> GetRecentActivityLogsPagedAsync(int page = 1, int pageSize = 20);

        // [Code Addition] Fetch activity logs based on the employee number (used in employee details).
        Task<IEnumerable<object>> GetEmployeeActivityLogsAsync(string employeeNumber);

        Task<object> GetMyActivityLogsPagedAsync(Guid accountId, int page = 1, int pageSize = 20);
    }
}
