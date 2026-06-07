using OTMS.Entities.DTOs.Notification.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.Models;

namespace OTMS.Service.Interfaces
{
    public interface INotificationService
    {
        System.Threading.Tasks.Task CreateTaskAssignedNotificationAsync(Entities.Models.Task task);
        System.Threading.Tasks.Task CreateTaskUpdateNotificationAsync(Entities.Models.Task task);
        System.Threading.Tasks.Task CreateDeadlineNotificationAsync(Entities.Models.Task task);
        System.Threading.Tasks.Task<PaginationResponseDTO<NotificationResponseDTO>> GetMyNotificationsAsync(PaginationDTO request);
        System.Threading.Tasks.Task<bool> MarkNotificationAsReadAsync(Guid notificationId);
        System.Threading.Tasks.Task CheckTaskDeadlinesAsync();
    }
}
