using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs.Notification.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace OTMS.Service.Services
{
    public class NotificationService(OTMSDbContext context, IHttpContextAccessor httpContextAccessor) : INotificationService
    {
        public async System.Threading.Tasks.Task CreateDeadlineNotificationAsync(Entities.Models.Task task)
        {
            var notification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo,
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskDeadlineApproaching,
                Message =
                    $"Task '{task.TaskTitle}' is nearing its deadline.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(notification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateTaskAssignedNotificationAsync(Entities.Models.Task task)
        {
            var notification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo, // EmployeeId = Assignee's AccountId
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskAssigned,
                Message =
                    $"You were assigned a new task: '{task.TaskTitle}'.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(notification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CheckTaskDeadlinesAsync()
        {
            var currentDate = DateTime.UtcNow;

            var upcomingTasks = await context.Tasks
                .Where(t =>
                    t.TaskStatus != "Completed"
                    &&
                    t.DueAt.HasValue
                    &&
                    t.DueAt.Value.Date <=
                        currentDate.AddDays(1).Date
                    &&
                    t.DueAt.Value.Date >= currentDate.Date)
                .ToListAsync();

            foreach (var task in upcomingTasks)
            {
                bool notificationExists =
                    await context.Notifications.AnyAsync(n =>
                        n.TaskId == task.TaskId
                        &&
                        n.NotificationType ==
                            NotificationTypes
                                .TaskDeadlineApproaching);
                if (!notificationExists)
                {
                    await CreateDeadlineNotificationAsync(task);
                }
            }
        }

        public async System.Threading.Tasks.Task<PaginationResponseDTO<NotificationResponseDTO>> GetMyNotificationsAsync(PaginationDTO request)
        {
            var accountIdClaim = httpContextAccessor
                .HttpContext?
                .User
                .FindFirst(ClaimTypes.NameIdentifier)?
                .Value;

            if (string.IsNullOrEmpty(accountIdClaim))
            {
                throw new UnauthorizedAccessException(
                    "Invalid user session.");
            }

            var accountId = Guid.Parse(accountIdClaim);

            var query = context.Notifications
                .Where(n => n.EmployeeId == accountId)
                .OrderByDescending(n => n.CreatedAt);

            var totalItems = await query.CountAsync();

            var data = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(n => new NotificationResponseDTO
                {
                    NotificationId = n.NotificationId,
                    TaskId = n.TaskId,
                    NotificationType = n.NotificationType,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                }).ToListAsync();

            return new PaginationResponseDTO<NotificationResponseDTO>
            {
                IsSuccess = true,
                Message = "Notifications retrieved successfully.",
                Data = data,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalRecords = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)request.PageSize)
            };

        }

        public async System.Threading.Tasks.Task<bool> MarkNotificationAsReadAsync(Guid notificationId)
        {
            var notification = await context.Notifications
                .FirstOrDefaultAsync(n =>
                    n.NotificationId == notificationId);

            if (notification == null)
            {
                return false;
            }

            notification.IsRead = true;

            await context.SaveChangesAsync();

            return true;
        }

        public async System.Threading.Tasks.Task CreateTaskUpdateNotificationAsync(Entities.Models.Task task)
        {
            var creatorNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.CreatedBy, // EmployeeId = Creator's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"You updated the task: '{task.TaskTitle}'.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var assigneeNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo, // EmployeeId = Assignee's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"{string.Join(" ", new[]
                        {task.Creator.Employee.FirstName, task.Creator.Employee.MiddleName, task.Creator.Employee.LastName, task.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the task: '{task.TaskTitle}'.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(creatorNotification);
            await context.Notifications.AddAsync(assigneeNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateEmployeeTaskUpdateNotificationAsync(Entities.Models.Task task)
        {
            var assigneeNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo, // EmployeeId = Assignee's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"You updated the task: '{task.TaskTitle}', its Task Status is now {task.TaskStatus}.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var creatorNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.CreatedBy, // EmployeeId = Creator's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"{string.Join(" ", new[]
                        {task.Assignee.Employee.FirstName, task.Assignee.Employee.MiddleName, task.Assignee.Employee.LastName, task.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the task: '{task.TaskTitle}', its Task Status is now {task.TaskStatus}.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(creatorNotification);
            await context.Notifications.AddAsync(assigneeNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateCompletedTaskUpdateNotificationAsync(Entities.Models.Task task)
        {
            var assigneeNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.AssignedTo, // EmployeeId = Assignee's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"You updated the task: '{task.TaskTitle}', its Task Status is now {task.TaskStatus}. It is ready for Reviewing.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var creatorNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = task.CreatedBy, // EmployeeId = Creator's Account ID
                TaskId = task.TaskId,
                NotificationType =
                    NotificationTypes.TaskUpdated,
                Message =
                    $"{string.Join(" ", new[]
                        {task.Assignee.Employee.FirstName, task.Assignee.Employee.MiddleName, task.Assignee.Employee.LastName, task.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the task: '{task.TaskTitle}', its Task Status is now {task.TaskStatus}. It is ready for Reviewing.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(creatorNotification);
            await context.Notifications.AddAsync(assigneeNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateLeaveRequestNotificationAsync(LeaveRequest leaveRequest)
        {

            var sysAdmin = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.Role == Roles.SystemAdmin);

            if (sysAdmin == null)
                throw new Exception("sysAdmin is not existing, cannot proceed.");

            var sysAdminNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = sysAdmin.AccountId,
                NotificationType =
                    NotificationTypes.LeaveRequestCreated,
                Message =
                    $"{string.Join(" ", new[]
                        {leaveRequest.Account.Employee.FirstName, leaveRequest.Account.Employee.MiddleName, leaveRequest.Account.Employee.LastName, leaveRequest.Account.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} submitted a Leave Request at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}. ",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var submitterNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = leaveRequest.AccountId,
                NotificationType =
                    NotificationTypes.LeaveRequestCreated,
                Message =
                    $"You submitted a Leave Request at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}. ",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(sysAdminNotification);
            await context.Notifications.AddAsync(submitterNotification);
            await context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task CreateEmergencyOverrideNotificationAsync(EmergencyOverrideRequest emergencyOverride)
        {
            var sysAdmin = await context.Accounts
               .Include(a => a.Employee)
               .FirstOrDefaultAsync(a => a.Role == Roles.SystemAdmin);

            if (sysAdmin == null)
                throw new Exception("sysAdmin is not existing, cannot proceed.");

            var sysAdminNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = sysAdmin.AccountId,
                NotificationType =
                   NotificationTypes.EmergencyOverrideCreated,
                Message =
                   $"{string.Join(" ", new[]
                       {emergencyOverride.RequestedBy.Employee.FirstName, emergencyOverride.RequestedBy.Employee.MiddleName, emergencyOverride.RequestedBy.Employee.LastName, emergencyOverride.RequestedBy.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} submitted an Emergency Override Request at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}. ",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var submitterNotification = new Notification
            {
                NotificationId = Guid.NewGuid(),
                EmployeeId = emergencyOverride.RequestedById,
                NotificationType =
                    NotificationTypes.LeaveRequestCreated,
                Message =
                    $"You submitted an Emergency Override Request at {DateTime.UtcNow.ToString("MM/dd/yyyy hh:mm:ss tt")}. ",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await context.Notifications.AddAsync(sysAdminNotification);
            await context.Notifications.AddAsync(submitterNotification);
            await context.SaveChangesAsync();
        }
    }
}
