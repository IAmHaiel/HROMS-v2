using Microsoft.AspNetCore.SignalR;

namespace OTMS.Hubs
{
    public class WorkflowHub : Hub
    {
        public async System.Threading.Tasks.Task JoinRequestGroup(string approvalRequestId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, approvalRequestId);
        }

        public async System.Threading.Tasks.Task LeaveRequestGroup(string approvalRequestId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, approvalRequestId);
        }

        public async System.Threading.Tasks.Task JoinUserGroup(string accountId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{accountId}");
        }

        public async System.Threading.Tasks.Task LeaveUserGroup(string accountId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{accountId}");
        }
    }
}
