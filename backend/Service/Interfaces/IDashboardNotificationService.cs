using System.Threading.Tasks;

namespace OTMS.Service.Interfaces
{
    public interface IDashboardNotificationService
    {
        Task NotifyDashboardDataChangedAsync();
    }
}
