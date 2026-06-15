using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.DTOs.Task;
using OTMS.Entities.DTOs.Task.Responses;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class TaskService(OTMSDbContext context, IHttpContextAccessor httpContextAccessor, IActivityLogService activityLogService, INotificationService notificationService) : ITaskService
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
                .Include(a => a.ActivityLogs)
                .FirstOrDefaultAsync(a => a.AccountId == request.AssignedTo);

            if (assignedAccount == null)
            {
                throw new Exception("Assigned employee not found.");
            }

            if (assignedAccount.AccountStatus == "On Leave")
            {
                throw new Exception("Cannot assign task to an employee who is on leave.");
            }

            var latestLog = assignedAccount.ActivityLogs.OrderByDescending(al => al.CreatedAt).FirstOrDefault();
            var presenceStatus = latestLog?.ActivityType == "Login" ? "Online" : "Offline";
            if (presenceStatus == "Offline")
            {
                throw new Exception("Cannot assign task to an offline employee.");
            }

            // Get Creator
            var creatorAccount = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == creatorId);

            if (creatorAccount == null)
            {
                throw new Exception("Creator account not found.");
            }

            // Check for duplicates or similar tasks
            bool exactDuplicateExists = await context.Tasks
                .AnyAsync(t => t.TaskTitle.ToLower() == request.TaskTitle.ToLower()
                    && t.TaskDescription!.ToLower() == request.TaskDescription!.ToLower());

            bool similarTaskExists = await context.Tasks
                .AnyAsync(t => t.TaskTitle.ToLower().Contains(request.TaskTitle.ToLower())
                    || request.TaskTitle.ToLower().Contains(t.TaskTitle.ToLower()));

            if (exactDuplicateExists)
            {
                await activityLogService.LogActivityAsync(
                creatorId,
                ActivityTypes.TaskDuplicateDetected,
                $"Duplicated Task {request.TaskTitle} detected at {DateTime.Now:hh:mm tt}.");

                throw new Exception(
                    "A task with the same title and description already exists.");
            }

            if (similarTaskExists)
            {
                await activityLogService.LogActivityAsync(
                creatorId,
                ActivityTypes.TaskSimilarityDetected,
                $"Similar Task {request.TaskTitle} detected at {DateTime.Now:hh:mm tt}.");

                throw new Exception(
                    "A similar task already exists.");
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

                CreatedAt = DateTime.UtcNow,
                Deleted = false
            };

            await context.Tasks.AddAsync(task);
            await context.SaveChangesAsync();

            // Integrate Notification
            await notificationService
                .CreateTaskAssignedNotificationAsync(task);

            await activityLogService.LogActivityAsync(
                creatorId,
                ActivityTypes.TaskCreated,
                $"{string.Join(" ", new[]
                    {creatorAccount.Employee.FirstName, creatorAccount.Employee.MiddleName, creatorAccount.Employee.LastName, creatorAccount.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} created the task {request.TaskTitle} at {DateTime.Now:hh:mm tt}");

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskDescription = task.TaskDescription,
                Priority = task.Priority,
                DueAt = task.DueAt,
                TaskStatus = task.TaskStatus,

                AssignedEmployee = string.Join(" ", new[]
                    {assignedAccount.Employee.FirstName, assignedAccount.Employee.MiddleName, assignedAccount.Employee.LastName, assignedAccount.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),
                CreatedByEmployee = string.Join(" ", new[]
                    {creatorAccount.Employee.FirstName, creatorAccount.Employee.MiddleName, creatorAccount.Employee.LastName, creatorAccount.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),

                CreatedAt = task.CreatedAt,
                IsDeleted = task.Deleted
            };
        }

        public async Task<TaskResponseDTO> UpdateTaskAsync(Guid taskId, UpdateTaskDTO request)
        {
            var task = await context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && !t.Deleted && !t.PermanentlyDeleted);

            if (task == null)
            {
                throw new Exception("Task not found.");
            }

            if (task.AssignedTo != request.AssignedTo)
            {
                var newAssignee = await context.Accounts
                    .Include(a => a.ActivityLogs)
                    .FirstOrDefaultAsync(a => a.AccountId == request.AssignedTo);

                if (newAssignee != null)
                {
                    if (newAssignee.AccountStatus == "On Leave")
                    {
                        throw new Exception("Cannot assign task to an employee who is on leave.");
                    }

                    var newAssigneeLog = newAssignee.ActivityLogs.OrderByDescending(al => al.CreatedAt).FirstOrDefault();
                    var presenceStatus = newAssigneeLog?.ActivityType == "Login" ? "Online" : "Offline";
                    if (presenceStatus == "Offline")
                    {
                        throw new Exception("Cannot assign task to an offline employee.");
                    }
                }
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

            // Integrate Notification
            await notificationService
                .CreateTaskUpdateNotificationAsync(task);

            await activityLogService.LogActivityAsync(
                task.CreatedBy,
                ActivityTypes.TaskUpdated,
                $"{string.Join(" ", new[]
                    {task.Creator.Employee.FirstName, task.Creator.Employee.MiddleName, task.Creator.Employee.LastName, task.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the Task '{task.TaskTitle}' at {DateTime.Now:hh:mm tt}");

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskDescription = task.TaskDescription,
                Priority = task.Priority,
                DueAt = task.DueAt,
                TaskStatus = task.TaskStatus,

                AssignedEmployee = string.Join(" ", new[]
                                        {
                                            assignedAccount?.Employee.FirstName,
                                            assignedAccount?.Employee.MiddleName,
                                            assignedAccount?.Employee.LastName,
                                            assignedAccount?.Employee.Suffix
                                        }.Where(n => !string.IsNullOrEmpty(n))),

                CreatedByEmployee = string.Join(" ", new[]
                                    {task.Creator.Employee.FirstName, task.Creator.Employee.MiddleName, task.Creator.Employee.LastName, task.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),
                CreatedAt = task.CreatedAt,
                IsDeleted = task.Deleted
            };
        }

        public async Task<TaskResponseDTO> ReopenTaskAsync(Guid taskId)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
            {
                throw new UnauthorizedAccessException("Invalid user session.");
            }
            var loggedInAccountId = Guid.Parse(accountIdClaim);
            var permissions = httpContextAccessor.HttpContext?.User.FindAll("Permission").Select(c => c.Value).ToList() ?? new List<string>();

            var task = await context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && !t.Deleted && !t.PermanentlyDeleted);

            if (task == null)
            {
                throw new Exception("Task not found.");
            }

            if (task.TaskStatus != "Completed")
            {
                throw new Exception("Only completed tasks can be reopened.");
            }

            bool canManageTasks = permissions.Contains("Permissions.Tasks.Manage");
            bool canViewTasks = permissions.Contains("Permissions.Tasks.View");

            if (!canManageTasks && !canViewTasks)
            {
                throw new UnauthorizedAccessException("You are not authorized to reopen tasks.");
            }

            if (!canManageTasks && canViewTasks)
            {
                if (task.AssignedTo != loggedInAccountId)
                {
                    throw new UnauthorizedAccessException("You can only reopen tasks assigned to you.");
                }
            }

            // Reopen Task
            task.TaskStatus = "In Progress";

            task.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                            task.CreatedBy,
                            ActivityTypes.ReopenedTask,
                            $"{string.Join(" ", new[]
                                {task.Creator.Employee.FirstName, task.Creator.Employee.MiddleName, task.Creator.Employee.LastName, task.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} reopened the Task '{task.TaskTitle}' at {DateTime.Now:hh:mm tt}");

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskDescription = task.TaskDescription,
                Priority = task.Priority,
                DueAt = task.DueAt,
                TaskStatus = task.TaskStatus,

                AssignedEmployee = string.Join(" ", new[]
                                    {task.Assignee.Employee.FirstName, task.Assignee.Employee.MiddleName, task.Assignee.Employee.LastName, task.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),

                CreatedByEmployee = string.Join(" ", new[]
                                    {task.Creator.Employee.FirstName, task.Creator.Employee.MiddleName, task.Creator.Employee.LastName, task.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),

                CreatedAt = task.CreatedAt,
                IsDeleted = task.Deleted
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

            // Get Logged-In User Permissions
            var permissions = httpContextAccessor.HttpContext?.User.FindAll("Permission").Select(c => c.Value).ToList() ?? new List<string>();

            if (!permissions.Contains("Permissions.Tasks.Manage") && !permissions.Contains("Permissions.Tasks.View"))
            {
                throw new UnauthorizedAccessException("You are not authorized to update task progress.");
            }

            // Get Task
            var task = await context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && !t.Deleted && !t.PermanentlyDeleted);

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

            // Immutability Check for Completed Tasks
            if (task.TaskStatus == "Completed")
            {
                throw new Exception("This task is completed and immutable. To make any changes, an Admin permission is required, or you must reopen the task first.");
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

            // For Notification
            if (task.TaskStatus == "Completed")
            {
                await notificationService
                    .CreateCompletedTaskUpdateNotificationAsync(task);
            }
            else
            {
                await notificationService
                    .CreateEmployeeTaskUpdateNotificationAsync(task);
            }

            await activityLogService.LogActivityAsync(
                task.AssignedTo,
                ActivityTypes.TaskUpdated,
                $"{string.Join(" ", new[]
                    {task.Assignee.Employee.FirstName, task.Assignee.Employee.MiddleName, task.Assignee.Employee.LastName, task.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the Task '{task.TaskTitle}' Progress at {DateTime.Now:hh:mm tt}");

            // Activity Log
            await activityLogService.LogActivityAsync(
                loggedInAccountId,
                "Task Progress Update",
                $"{string.Join(" ", new[]
                    {task.Assignee.Employee.FirstName, task.Assignee.Employee.MiddleName, task.Assignee.Employee.LastName, task.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated task '{task.TaskTitle}' to '{task.TaskStatus}'.");

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskDescription = task.TaskDescription,
                Priority = task.Priority,
                DueAt = task.DueAt,
                TaskStatus = task.TaskStatus,

                AssignedEmployee = string.Join(" ", new[]
                                    {task.Assignee.Employee.FirstName, task.Assignee.Employee.MiddleName, task.Assignee.Employee.LastName, task.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),

                CreatedByEmployee = string.Join(" ", new[]
                                    {task.Creator.Employee.FirstName, task.Creator.Employee.MiddleName, task.Creator.Employee.LastName, task.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),

                CreatedAt = task.CreatedAt,
                IsDeleted = task.Deleted
            };
        }

        public async Task<PaginationResponseDTO<TaskResponseDTO>> GetMyTasksAsync(PaginationDTO request)
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

            // Get Logged-In Role Permissions
            var permissions = httpContextAccessor.HttpContext?.User.FindAll("Permission").Select(c => c.Value).ToList() ?? new List<string>();

            if (!permissions.Contains("Permissions.Tasks.Manage") && !permissions.Contains("Permissions.Tasks.View"))
            {
                throw new UnauthorizedAccessException("You are not authorized to access tasks.");
            }

            // Get Assigned Tasks
            var query = context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .Where(t =>
                        (
                            t.AssignedTo == loggedInAccountId
                            || t.CreatedBy == loggedInAccountId
                        )
                        && !t.Deleted
                        && !t.PermanentlyDeleted)
                .OrderByDescending(t => t.CreatedAt);

            var totalRecords = await query.CountAsync();

            var data = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(t => new TaskResponseDTO
                {
                    TaskId = t.TaskId,
                    TaskTitle = t.TaskTitle,
                    TaskDescription = t.TaskDescription,
                    Priority = t.Priority,
                    DueAt = t.DueAt,
                    TaskStatus = t.TaskStatus,
                    AssignedEmployee = string.Join(" ", new[]
                                    {t.Assignee.Employee.FirstName, t.Assignee.Employee.MiddleName, t.Assignee.Employee.LastName, t.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),

                    CreatedByEmployee = string.Join(" ", new[]
                                    {t.Creator.Employee.FirstName, t.Creator.Employee.MiddleName, t.Creator.Employee.LastName, t.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),
                    CreatedAt = t.CreatedAt,
                    IsDeleted = t.Deleted
                }).ToListAsync();

            return new PaginationResponseDTO<TaskResponseDTO>
            {
                IsSuccess = true,
                Message = "Tasks retrieved successfully.",
                Data = data,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling((double)totalRecords / request.PageSize)
            };

        }

        public async Task<TaskDeleteResponseDTO> DeleteTaskAsync(Guid taskId)
        {
            // Get the task to be deleted
            var task = await context.Tasks
                .FirstOrDefaultAsync(t => t.TaskId == taskId && !t.Deleted && !t.PermanentlyDeleted);

            if (task == null)
            {
                throw new KeyNotFoundException("Task not found.");
            }

            // Change the isDeleted flag to true
            task.Deleted = true;

            // Save changes to database
            await context.SaveChangesAsync();

            // Return a response indicating successful deletion
            return new TaskDeleteResponseDTO
            {
                IsDeleted = true,
                Message = "Task deleted successfully."
            };

            //throw new NotImplementedException();
        }

        public async Task<ApiResponseDTO<TaskResponseDTO>> RestoreTaskAsync(Guid taskId)
        {
            var task = await context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.Deleted && !t.PermanentlyDeleted);

            if (task == null)
                throw new Exception("Task not found or is not deleted.");

            task.Deleted = false;
            await context.SaveChangesAsync();

            return new ApiResponseDTO<TaskResponseDTO>
            {
                IsSuccess = true,
                Message = "Task restored successfully.",
                Data = new TaskResponseDTO
                {
                    TaskId = task.TaskId,
                    TaskTitle = task.TaskTitle,
                    TaskDescription = task.TaskDescription,
                    Priority = task.Priority,
                    DueAt = task.DueAt,
                    TaskStatus = task.TaskStatus,
                    AssignedEmployee = string.Join(" ", new[]
                                    {task.Assignee.Employee.FirstName, task.Assignee.Employee.MiddleName, task.Assignee.Employee.LastName, task.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),

                    CreatedByEmployee = string.Join(" ", new[]
                                    {task.Creator.Employee.FirstName, task.Creator.Employee.MiddleName, task.Creator.Employee.LastName, task.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),
                    CreatedAt = task.CreatedAt,
                    IsDeleted = task.Deleted
                }
            };
        }

        public async Task<ApiResponseDTO<PaginationResponseDTO<TaskResponseDTO>>> BinRecordsAsync(string EmployeeID, PaginationDTO pagination)
        {
            var employee = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.EmployeeNumber == EmployeeID);

            if (employee == null)
                throw new Exception("Employee not found.");

            var query = context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .Where(t =>
                    (
                        t.AssignedTo == employee.Account.AccountId
                        || t.CreatedBy == employee.Account.AccountId
                    )
                    && t.Deleted
                    && !t.PermanentlyDeleted)
                .OrderByDescending(t => t.CreatedAt);

            var totalRecords = await query.CountAsync();

            var data = await query
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(t => new TaskResponseDTO
                {
                    TaskId = t.TaskId,
                    TaskTitle = t.TaskTitle,
                    TaskDescription = t.TaskDescription,
                    Priority = t.Priority,
                    DueAt = t.DueAt,
                    TaskStatus = t.TaskStatus,
                    AssignedEmployee = string.Join(" ", new[]
                                    {t.Assignee.Employee.FirstName, t.Assignee.Employee.MiddleName, t.Assignee.Employee.LastName, t.Assignee.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),

                    CreatedByEmployee = string.Join(" ", new[]
                                    {t.Creator.Employee.FirstName, t.Creator.Employee.MiddleName, t.Creator.Employee.LastName, t.Creator.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n))),
                    CreatedAt = t.CreatedAt,
                    IsDeleted = t.Deleted
                }).ToListAsync();

            return new ApiResponseDTO<PaginationResponseDTO<TaskResponseDTO>>
            {
                IsSuccess = true,
                Message = "Bin records retrieved successfully.",
                Data = new PaginationResponseDTO<TaskResponseDTO>
                {
                    Data = data,
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalRecords = totalRecords,
                    TotalPages = (int)Math.Ceiling((double)totalRecords / pagination.PageSize)
                }
            };
        }

        public async Task<ApiResponseDTO<object>> EmptyBinAsync(string EmployeeID)
        {
            var employee = context.Employees
                .Include(e => e.Account)
                .FirstOrDefault(e => e.EmployeeNumber == EmployeeID);

            if (employee == null)
                throw new Exception("Employee not found.");

            if (employee.Account == null)
                throw new Exception("Account not found.");

            // Performs a Single SQL UPDATE instead of loading entities into memory
            await context.Tasks
                .Where(t =>
                    (
                        t.AssignedTo == employee.Account.AccountId
                        || t.CreatedBy == employee.Account.AccountId
                    )
                    && t.Deleted
                    && !t.PermanentlyDeleted)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(t => t.PermanentlyDeleted, true));

            return new ApiResponseDTO<object>
            {
                IsSuccess = true,
                Message = "Bin emptied successfully.",
                Data = null
            };
        }

        public async Task<ApiResponseDTO<PaginationResponseDTO<AssignableEmployeeDTO>>> GetAssignableEmployeesAsync(PaginationDTO pagination, string? nameFilter)
        {
            var query = context.Accounts
                .Include(a => a.Employee)
                .Include(a => a.ActivityLogs)
                .Include(a => a.AssignedTasks)
                .Where(a => a.Role != null && a.Role.RolePermissions.Any(rp => rp.Permission.Name == "Permissions.Tasks.View") && !a.Role.RolePermissions.Any(rp => rp.Permission.Name == "Permissions.Tasks.Manage"))
                .Where(a => a.AccountStatus != "On Leave");

            if (!string.IsNullOrEmpty(nameFilter))
            {
                var lowerFilter = nameFilter.ToLower();
                query = query.Where(a => 
                    a.Employee.FirstName.ToLower().Contains(lowerFilter) ||
                    a.Employee.LastName.ToLower().Contains(lowerFilter) ||
                    a.Employee.MiddleName.ToLower().Contains(lowerFilter) ||
                    a.Employee.Suffix.ToLower().Contains(lowerFilter));
            }

            var accounts = await query.ToListAsync();

            var assignableList = new List<AssignableEmployeeDTO>();

            foreach (var a in accounts)
            {
                var latestLog = a.ActivityLogs.OrderByDescending(al => al.CreatedAt).FirstOrDefault();
                var presenceStatus = latestLog?.ActivityType == "Login" ? "Online" : "Offline";

                if (presenceStatus == "Offline")
                {
                    continue; // Exclude Offline
                }

                var activeTasks = a.AssignedTasks.Count(t => t.TaskStatus != "Completed" && t.TaskStatus != "Closed" && t.TaskStatus != "Cancelled" && !t.Deleted && !t.PermanentlyDeleted);

                var fullName = string.Join(" ", new[] { a.Employee.FirstName, a.Employee.MiddleName, a.Employee.LastName, a.Employee.Suffix }.Where(n => !string.IsNullOrEmpty(n)));

                assignableList.Add(new AssignableEmployeeDTO
                {
                    AccountId = a.AccountId,
                    DisplayName = fullName,
                    Role = a.Role.Name,
                    ActiveTaskCount = activeTasks,
                    IsRecommended = false
                });
            }

            if (assignableList.Any())
            {
                var minTasks = assignableList.Min(x => x.ActiveTaskCount);
                foreach (var emp in assignableList)
                {
                    if (emp.ActiveTaskCount == minTasks)
                    {
                        emp.IsRecommended = true;
                        emp.DisplayName = $"{emp.DisplayName} ({emp.ActiveTaskCount} tasks) - Recommended";
                    }
                    else
                    {
                        emp.DisplayName = $"{emp.DisplayName} ({emp.ActiveTaskCount} tasks)";
                    }
                }
            }

            var totalRecords = assignableList.Count;

            var pagedData = assignableList
                .OrderByDescending(x => x.IsRecommended)
                .ThenBy(x => x.ActiveTaskCount)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToList();

            return new ApiResponseDTO<PaginationResponseDTO<AssignableEmployeeDTO>>
            {
                IsSuccess = true,
                Message = "Assignable employees retrieved successfully.",
                Data = new PaginationResponseDTO<AssignableEmployeeDTO>
                {
                    Data = pagedData,
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalRecords = totalRecords,
                    TotalPages = (int)Math.Ceiling(totalRecords / (double)pagination.PageSize)
                }
            };
        }
    }
}
