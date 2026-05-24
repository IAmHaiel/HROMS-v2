using OTMS.Entities.Models;

namespace OTMS.Service.Interfaces
{
    public interface INotificationService
    {
        System.Threading.Tasks.Task CreateTaskAssignedNotificationAsync(Entities.Models.Task task);
        System.Threading.Tasks.Task CreateDeadlineNotificationAsync(Entities.Models.Task task);
    }
}
