namespace OTMS.Service.Interfaces
{
    public interface INotificationService
    {
        Task CreateTaskAssignedNotificationAsync(Task task);
        Task CreateDeadlineNotificationAsync(Task task);
    }
}
