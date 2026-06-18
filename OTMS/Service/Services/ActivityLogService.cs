using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.ActivityLogs.Responses;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class ActivityLogService(OTMSDbContext context) : IActivityLogService
    {
        public async Task<string> GetOnlineActivityAsync(Guid employeeId)
        {
            var account = await context.Accounts
                .Include(a => a.Employee)
                .Include(a => a.ActivityLogs)
                .FirstOrDefaultAsync(a => a.Employee.EmployeeId == employeeId);

            if (account is null || account.Employee is null)
            {
                throw new Exception("Employee not found.");
            }

            var latestActivity = account.ActivityLogs
                .OrderByDescending(al => al.CreatedAt)
                .FirstOrDefault();

            if (latestActivity is null)
            {
                return "Offline";
            }

            return latestActivity.ActivityType switch
            {
                "Login" => "Online",
                "Logout" => "Offline",
                _ => "Offline"
            };
        }

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

                FirstName = account.Employee.FirstName,
                MiddleName = account.Employee.MiddleName,
                LastName = account.Employee.LastName,
                Suffix = account.Employee.Suffix,

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
                
                FirstName = account.Employee.FirstName,
                MiddleName = account.Employee.MiddleName,
                LastName = account.Employee.LastName,
                Suffix = account.Employee.Suffix,

                ActivityType = activityLog.ActivityType,
                Description = activityLog.Description,
                CreatedAt = activityLog.CreatedAt
            };
        }

        public async Task<IEnumerable<object>> GetRecentActivityLogsAsync(int count = 50)
        {
            return await context.ActivityLogs
                .OrderByDescending(al => al.CreatedAt)
                .Take(count)
                .Select(al => new
                {
                    activityLogId = al.ActivityLogId,
                    activityType = al.ActivityType,
                    description = al.Description,
                    createdAt = System.DateTime.SpecifyKind(al.CreatedAt, System.DateTimeKind.Utc)
                })
                .ToListAsync();
        }

        public async Task<object> GetRecentActivityLogsPagedAsync(int page = 1, int pageSize = 20)
        {
            var totalRecords = await context.ActivityLogs.CountAsync();
            var totalPages = (int)System.Math.Ceiling(totalRecords / (double)pageSize);
            var logs = await context.ActivityLogs
                .OrderByDescending(al => al.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(al => new
                {
                    activityLogId = al.ActivityLogId,
                    activityType = al.ActivityType,
                    description = al.Description,
                    createdAt = System.DateTime.SpecifyKind(al.CreatedAt, System.DateTimeKind.Utc)
                })
                .ToListAsync();

            return new
            {
                IsSuccess = true,
                Message = "Activity logs retrieved successfully.",
                Data = logs,
                PageNumber = page,
                PageSize = pageSize,
                TotalRecords = totalRecords,
                TotalPages = totalPages
            };
        }

        // [Code Addition] Dedicated method to fetch activity logs for a specific employee number, primarily utilized by EmployeeDetailPanel.
        public async Task<IEnumerable<object>> GetEmployeeActivityLogsAsync(string employeeNumber)
        {
            var employee = await context.Employees.Include(e => e.Account).FirstOrDefaultAsync(e => e.EmployeeNumber == employeeNumber);
            if (employee == null || employee.Account == null) return new List<object>();

            return await context.ActivityLogs
                .Where(al => al.AccountId == employee.Account.AccountId) // [Code Addition] Filtering logs tied explicitly to the queried employee
                .OrderByDescending(al => al.CreatedAt)
                .Select(al => new
                {
                    activityLogId = al.ActivityLogId,
                    activityType = al.ActivityType,
                    description = al.Description,
                    createdAt = System.DateTime.SpecifyKind(al.CreatedAt, System.DateTimeKind.Utc)
                })
                .ToListAsync();
        }
    }
}
