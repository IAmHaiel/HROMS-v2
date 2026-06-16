using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using OTMS.Hubs;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class DashboardNotificationService(IHubContext<WorkflowHub> hubContext) : IDashboardNotificationService
    {
        public async Task NotifyDashboardDataChangedAsync()
        {
            await hubContext.Clients.Group("dashboard").SendAsync("DashboardDataChanged", "New task data available");
        }
    }
}
