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
        System.Threading.Tasks.Task CreateEmployeeTaskUpdateNotificationAsync(Entities.Models.Task task);
        System.Threading.Tasks.Task CreateCompletedTaskUpdateNotificationAsync(Entities.Models.Task task);
        System.Threading.Tasks.Task CreateTaskReviewRequestedNotificationAsync(Entities.Models.Task task);
        System.Threading.Tasks.Task CreateTaskReturnedForReworkNotificationAsync(Entities.Models.Task task);
        System.Threading.Tasks.Task CreateTaskApprovedAndClosedNotificationAsync(Entities.Models.Task task);
        System.Threading.Tasks.Task CreateDeadlineNotificationAsync(Entities.Models.Task task);
        System.Threading.Tasks.Task CreateLeaveRequestNotificationAsync(LeaveRequest leaveRequest);
        System.Threading.Tasks.Task CreateEmergencyOverrideNotificationAsync(EmergencyOverrideRequest emergencyOverride);
        System.Threading.Tasks.Task CreateGeneralNotificationAsync(Guid accountId, string title, string message);
        System.Threading.Tasks.Task<PaginationResponseDTO<NotificationResponseDTO>> GetMyNotificationsAsync(PaginationDTO request);
        System.Threading.Tasks.Task<bool> MarkNotificationAsReadAsync(Guid notificationId);
        System.Threading.Tasks.Task CheckTaskDeadlinesAsync();

        System.Threading.Tasks.Task CreateEmailNotificationAsync(Guid accountId, string subject, string body);
        System.Threading.Tasks.Task DispatchApproverNotificationAsync(Guid approverAccountId, ApprovalRequest request);
        System.Threading.Tasks.Task DispatchRequesterNotificationAsync(Guid requesterAccountId, ApprovalRequest request, string outcome);
        System.Threading.Tasks.Task LogNotificationDispatchAsync(Guid approvalRequestId, Guid recipientId, string notificationType, string channel, string status, string? errorMessage = null);
    }
}
