using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.Task;
using OTMS.Entities.DTOs.Task.Responses;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Service.Services
{
    public class TaskService(OTMSDbContext context, IHttpContextAccessor httpContextAccessor, IActivityLogService activityLogService) : ITaskService
    {
        public async Task<TaskResponseDTO> CreateTaskAsync(CreateTaskDTO request)
        {
            // Get Logged In User
            var accountIdClaim = httpContextAccessor
                .HttpContext?
                .User
                .FindFirst(ClaimTypes.NameIdentifier)?
                .Value;

            if (string.IsNullOrEmpty(accountIdClaim))
            {
                throw new UnauthorizedAccessException("Invalid user session.");
            }

            var creatorId = Guid.Parse(accountIdClaim);

            // Check Assigned Employee
            var assignedAccount = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == request.AssignedTo);

            if (assignedAccount == null)
            {
                throw new Exception("Assigned employee not found.");
            }

            // Get Creator
            var creatorAccount = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == creatorId);

            if (creatorAccount == null)
            {
                throw new Exception("Creator account not found.");
            }

            // Create Task
            var task = new OTMS.Entities.Models.Task
            {
                TaskId = Guid.NewGuid(),
                CreatedBy = creatorId,
                AssignedTo = request.AssignedTo,

                TaskTitle = request.TaskTitle,
                TaskDescription = request.TaskDescription,
                Priority = request.Priority,
                DueAt = request.DueAt,

                TaskStatus = "Pending",

                CreatedAt = DateTime.UtcNow
            };

            await context.Tasks.AddAsync(task);
            await context.SaveChangesAsync();

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskDescription = task.TaskDescription,
                Priority = task.Priority,
                DueAt = task.DueAt,
                TaskStatus = task.TaskStatus,

                AssignedEmployee = assignedAccount.Employee.EmployeeName,
                CreatedByEmployee = creatorAccount.Employee.EmployeeName,

                CreatedAt = task.CreatedAt
            };
        }

        public async Task<TaskResponseDTO> UpdateTaskAsync(Guid taskId, UpdateTaskDTO request)
        {
            var task = await context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(t => t.TaskId == taskId);

            if (task == null)
            {
                throw new Exception("Task not found.");
            }

            // Update Fields
            task.TaskTitle = request.TaskTitle;
            task.TaskDescription = request.TaskDescription;
            task.Priority = request.Priority;
            task.DueAt = request.DueAt;
            task.AssignedTo = request.AssignedTo;
            task.TaskRemarks = request.TaskRemarks;

            task.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            // Reload assignee if changed
            var assignedAccount = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == request.AssignedTo);

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskDescription = task.TaskDescription,
                Priority = task.Priority,
                DueAt = task.DueAt,
                TaskStatus = task.TaskStatus,

                AssignedEmployee = assignedAccount?.Employee.EmployeeName ?? "",

                CreatedByEmployee = task.Creator.Employee.EmployeeName,

                CreatedAt = task.CreatedAt
            };
        }

        public async Task<TaskResponseDTO> ReopenTaskAsync(Guid taskId)
        {
            var task = await context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(t => t.TaskId == taskId);

            if (task == null)
            {
                throw new Exception("Task not found.");
            }

            if (task.TaskStatus != "Completed")
            {
                throw new Exception("Only completed tasks can be reopened.");
            }

            // Reopen Task
            task.TaskStatus = "In Progress";

            task.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskDescription = task.TaskDescription,
                Priority = task.Priority,
                DueAt = task.DueAt,
                TaskStatus = task.TaskStatus,

                AssignedEmployee = task.Assignee.Employee.EmployeeName,

                CreatedByEmployee = task.Creator.Employee.EmployeeName,

                CreatedAt = task.CreatedAt
            };
        }

        public async Task<TaskResponseDTO> UpdateTaskProgressAsync(Guid taskId, UpdateTaskProgressDTO request)
        {
            // Get Logged-In User
            var accountIdClaim = httpContextAccessor
                .HttpContext?
                .User
                .FindFirst(ClaimTypes.NameIdentifier)?
                .Value;

            if (string.IsNullOrEmpty(accountIdClaim))
            {
                throw new UnauthorizedAccessException("Invalid user session.");
            }

            var loggedInAccountId = Guid.Parse(accountIdClaim);

            // Get Logged-In User Role
            var roleClaim = httpContextAccessor
                .HttpContext?
                .User
                .FindFirst(ClaimTypes.Role)?
                .Value;

            // Allowed Roles
            var allowedRoles = new[]
            {"OperationsAdmin", "Encoder", "Coordinator"};

            if (string.IsNullOrEmpty(roleClaim)
                || !allowedRoles.Contains(roleClaim))
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to update task progress.");
            }

            // Get Task
            var task = await context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(t => t.TaskId == taskId);

            if (task == null)
            {
                throw new Exception("Task not found.");
            }

            // SECURITY CHECK
            // Only assigned employee can update progress
            if (task.AssignedTo != loggedInAccountId)
            {
                throw new UnauthorizedAccessException(
                    "You can only update tasks assigned to you.");
            }

            // Validate Status
            var validStatuses = new[]
            {"Pending", "In Progress", "Completed"};

            if (!validStatuses.Contains(request.TaskStatus))
            {
                throw new Exception("Invalid task status.");
            }

            // Update Progress
            task.TaskStatus = request.TaskStatus;

            if (!string.IsNullOrWhiteSpace(request.TaskRemarks))
            {
                task.TaskRemarks = request.TaskRemarks;
            }

            task.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            // Activity Log
            await activityLogService.LogActivityAsync(
                loggedInAccountId,
                "Task Progress Update",
                $"{task.Assignee.Employee.EmployeeName} updated task '{task.TaskTitle}' to '{task.TaskStatus}'.");

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskDescription = task.TaskDescription,
                Priority = task.Priority,
                DueAt = task.DueAt,
                TaskStatus = task.TaskStatus,

                AssignedEmployee = task.Assignee.Employee.EmployeeName,

                CreatedByEmployee = task.Creator.Employee.EmployeeName,

                CreatedAt = task.CreatedAt
            };
        }

        public async Task<List<TaskResponseDTO>> GetMyTasksAsync()
        {
            // Get Logged-In Account ID
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

            var loggedInAccountId = Guid.Parse(accountIdClaim);

            // Get Logged-In Role
            var roleClaim = httpContextAccessor
                .HttpContext?
                .User
                .FindFirst(ClaimTypes.Role)?
                .Value;

            // Allowed Roles
            var allowedRoles = new[]
            {"OperationsAdmin", "Encoder", "Coordinator"};

            if (string.IsNullOrEmpty(roleClaim)
                || !allowedRoles.Contains(roleClaim))
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to access tasks.");
            }

            // Get Assigned Tasks
            var tasks = await context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .Where(t => t.AssignedTo == loggedInAccountId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return tasks.Select(task => new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskDescription = task.TaskDescription,
                Priority = task.Priority,
                DueAt = task.DueAt,
                TaskStatus = task.TaskStatus,
                AssignedEmployee = task.Assignee.Employee.EmployeeName,
                CreatedByEmployee = task.Creator.Employee.EmployeeName,
                CreatedAt = task.CreatedAt
            }).ToList();
        }
    }
}
