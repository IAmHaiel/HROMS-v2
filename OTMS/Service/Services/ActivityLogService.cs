using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.ActivityLogs.Responses;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class ActivityLogService(OTMSDbContext context) : IActivityLogService
    {
        public async Task<PresenceResponseDTO> GetPresenceAsync(Guid employeeId)
        {
            var account = await context.Accounts
                .Include(a => a.Employee)
                .Include(a => a.ActivityLogs)
                .FirstOrDefaultAsync(a => a.Employee.EmployeeId == employeeId);

            if (account is null || account.Employee is null)
            {
                throw new Exception("Employee not found.");
            }
            
            var lastActivity = account.ActivityLogs
                .OrderByDescending(al => al.CreatedAt)
                .FirstOrDefault();

            DateTime? lastSeen = lastActivity?.CreatedAt;

            bool isOnline =
                lastSeen.HasValue &&
                lastSeen.Value >= DateTime.UtcNow.AddMinutes(-5); // Consider online if last activity was within the last 5 minutes

            return new PresenceResponseDTO
            {
                accountId = account.AccountId,
                employeeName = account.Employee.EmployeeName,
                presenceStatus = isOnline ? "Online" : "Offline",
                lastSeen = lastSeen
            };
        }

        public async Task<ActivityLogResponseDTO> LogActivityAsync(Guid AccountId, string ActivityType, string Description)
        {
            var account = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == AccountId);

            if (account == null)
                throw new Exception("Account not found.");

            var activityLog = new ActivityLog
            {
                ActivityLogId = Guid.NewGuid(),
                AccountId = AccountId,
                ActivityType = ActivityType,
                Description = Description,
                CreatedAt = DateTime.UtcNow
            };

            await context.ActivityLogs.AddAsync(activityLog);
            await context.SaveChangesAsync();

            return new ActivityLogResponseDTO
            {
                ActivityLogId = activityLog.ActivityLogId,
                AccountId = AccountId,
                EmployeeName = account.Employee.EmployeeName,
                ActivityType = activityLog.ActivityType,
                Description = activityLog.Description,
                CreatedAt = activityLog.CreatedAt
            };
        }
    }
}
