using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Common.Exceptions;
using OTMS.Common.Helpers;
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
    public class TaskService(OTMSDbContext context, IHttpContextAccessor httpContextAccessor, IActivityLogService activityLogService, INotificationService notificationService, IFileService fileService) : ITaskService
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
            Account? assignedAccount = null;
            if (request.AssignedTo.HasValue)
            {
                assignedAccount = await context.Accounts
                    .Include(a => a.Employee)
                    .Include(a => a.ActivityLogs)
                    .FirstOrDefaultAsync(a => a.AccountId == request.AssignedTo.Value);

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
            }

            // Get Creator
            var creatorAccount = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == creatorId);

            if (creatorAccount == null)
            {
                throw new Exception("Creator account not found.");
            }

            // Check for duplicate or similar tasks using Jaccard Similarity (70% threshold)
            var existingTasks = await context.Tasks
                .Where(t => !t.Deleted && !t.PermanentlyDeleted)
                .Select(t => new { t.TaskId, t.TaskTitle, t.TaskDescription, t.TaskStatus })
                .ToListAsync();

            var duplicates = new List<DuplicateTaskWarningDTO>();
            const double SimilarityThreshold = 0.70;

            foreach (var existing in existingTasks)
            {
                double similarity = TextSimilarityHelper.CalculateWeightedSimilarity(
                    request.TaskTitle, request.TaskDescription,
                    existing.TaskTitle, existing.TaskDescription);

                if (similarity >= SimilarityThreshold)
                {
                    duplicates.Add(new DuplicateTaskWarningDTO
                    {
                        ExistingTaskTitle = existing.TaskTitle,
                        ExistingTaskId = existing.TaskId,
                        ExistingTaskStatus = existing.TaskStatus,
                        SimilarityPercentage = Math.Round(similarity * 100, 2)
                    });
                }
            }

            if (duplicates.Any() && !request.IsDuplicateAcknowledged)
            {
                throw new DuplicateTaskException(duplicates);
            }

            if (duplicates.Any() && request.IsDuplicateAcknowledged)
            {
                await activityLogService.LogActivityAsync(
                    creatorId,
                    ActivityTypes.TaskDuplicateDetected,
                    $"Admin proceeded with task creation despite duplicate warnings for '{request.TaskTitle}'.");
            }



            // Create Task
            var task = new OTMS.Entities.Models.Task
            {
                TaskId = Guid.NewGuid(),
                CreatedBy = creatorId,
                AssignedTo = request.AssignedTo,

                TaskTitle = request.TaskTitle,
                TaskDescription = request.TaskDescription,
                TaskCategory = request.TaskCategory,
                Priority = request.Priority,
                DueAt = request.DueAt,

                TaskStatus = request.AssignedTo.HasValue ? "Assigned" : "Draft",

                CreatedAt = DateTime.UtcNow,
                Deleted = false
            };

            await context.Tasks.AddAsync(task);
            await context.SaveChangesAsync();

            await RecordTaskStatusAsync(task.TaskId, "None", "Draft", creatorId, true);
            if (request.AssignedTo.HasValue)
            {
                await RecordTaskStatusAsync(task.TaskId, "Draft", "Assigned", creatorId, true);
            }

            await activityLogService.LogActivityAsync(
                creatorId,
                ActivityTypes.TaskCreated,
                $"{string.Join(" ", new[]
                    {creatorAccount.Employee.FirstName, creatorAccount.Employee.MiddleName, creatorAccount.Employee.LastName, creatorAccount.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} created the task {request.TaskTitle} at {DateTime.Now:hh:mm tt}");

            if (request.AssignedTo.HasValue)
            {
                // Integrate Notification
                await notificationService
                    .CreateTaskAssignedNotificationAsync(task);

                if (request.RecommendedEmployeeId.HasValue)
                {
                    if (request.AssignedTo == request.RecommendedEmployeeId.Value)
                    {
                        await activityLogService.LogActivityAsync(
                            creatorId,
                            "Task Assignment Recommendation",
                            $"Recommendation accepted. Task assigned to {string.Join(" ", new[] { assignedAccount!.Employee.FirstName, assignedAccount.Employee.MiddleName, assignedAccount.Employee.LastName, assignedAccount.Employee.Suffix }.Where(n => !string.IsNullOrEmpty(n)))}."
                        );
                    }
                    else
                    {
                        await activityLogService.LogActivityAsync(
                            creatorId,
                            "Task Assignment Recommendation",
                            $"Recommendation overridden. System recommended Employee ID {request.RecommendedEmployeeId.Value}, but task was assigned to {string.Join(" ", new[] { assignedAccount!.Employee.FirstName, assignedAccount.Employee.MiddleName, assignedAccount.Employee.LastName, assignedAccount.Employee.Suffix }.Where(n => !string.IsNullOrEmpty(n)))}."
                        );
                    }
                }
            }

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
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
            {
                throw new UnauthorizedAccessException("Invalid user session.");
            }
            var loggedInAccountId = Guid.Parse(accountIdClaim);

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

            if (task.TaskStatus == "Completed")
            {
                throw new Exception("Completed tasks cannot be modified. Administrator override required.");
            }

            if (task.AssignedTo != request.AssignedTo)
            {
                if (request.AssignedTo.HasValue)
                {
                    var newAssignee = await context.Accounts
                        .Include(a => a.ActivityLogs)
                        .FirstOrDefaultAsync(a => a.AccountId == request.AssignedTo.Value);

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

                if (task.TaskStatus == "Draft" && request.AssignedTo.HasValue)
                {
                    task.TaskStatus = "Assigned";
                    await RecordTaskStatusAsync(task.TaskId, "Draft", "Assigned", loggedInAccountId, true);
                }
            }

            // Update Fields
            task.TaskTitle = request.TaskTitle;
            task.TaskDescription = request.TaskDescription;
            task.TaskCategory = request.TaskCategory;
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

        public async Task<TaskResponseDTO> RequestReopenTaskAsync(Guid taskId, RequestReopenDTO request)
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

            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                throw new Exception("Reopening reason is required.");
            }

            if (request.Reason.Length > 500)
            {
                throw new Exception("Reopening reason must not exceed 500 characters.");
            }

            if (request.SupportingEvidence != null)
            {
                var allowedTypes = new[] { "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png" };
                if (!allowedTypes.Contains(request.SupportingEvidence.ContentType))
                {
                    throw new Exception("Only PDF, DOCX, XLSX, JPG, and PNG files are allowed.");
                }
                if (request.SupportingEvidence.Length > 20 * 1024 * 1024)
                {
                    throw new Exception("File size must not exceed 20MB.");
                }
            }

            bool canManageTasks = permissions.Contains("Permissions.Tasks.Manage");
            bool canViewTasks = permissions.Contains("Permissions.Tasks.View");

            if (!canManageTasks && !canViewTasks)
            {
                throw new UnauthorizedAccessException("You are not authorized to request task reopening.");
            }

            if (!canManageTasks && canViewTasks)
            {
                if (task.AssignedTo != loggedInAccountId)
                {
                    throw new UnauthorizedAccessException("You can only request reopening of tasks assigned to you.");
                }
            }

            string? evidenceUrl = null;
            if (request.SupportingEvidence != null)
            {
                evidenceUrl = await fileService.UploadFileAsync(request.SupportingEvidence, "task_evidence");
            }

            var reopenRequest = new TaskReopenRequest
            {
                RequestId = Guid.NewGuid(),
                TaskId = taskId,
                RequestedById = loggedInAccountId,
                Reason = request.Reason,
                EvidenceUrl = evidenceUrl,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await context.TaskReopenRequests.AddAsync(reopenRequest);
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                loggedInAccountId,
                "Task Reopen Requested",
                $"Reopen requested for Task '{task.TaskTitle}'. Reason: {request.Reason}");

            // Notify Operations Admin
            var admins = await context.Accounts
                .Where(a => a.Role != null && a.Role.RolePermissions.Any(rp => rp.Permission.Name == "Permissions.Tasks.Manage"))
                .ToListAsync();

            foreach (var admin in admins)
            {
                await notificationService.CreateGeneralNotificationAsync(admin.AccountId, "Task Reopen Request", $"A reopen request was submitted for Task '{task.TaskTitle}'.");
            }

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskDescription = task.TaskDescription,
                Priority = task.Priority,
                DueAt = task.DueAt,
                TaskStatus = task.TaskStatus,
                AssignedEmployee = string.Join(" ", new[] { task.Assignee.Employee.FirstName, task.Assignee.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))),
                CreatedByEmployee = string.Join(" ", new[] { task.Creator.Employee.FirstName, task.Creator.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))),
                CreatedAt = task.CreatedAt,
                IsDeleted = task.Deleted
            };
        }

        public async Task<TaskResponseDTO> ReviewReopenRequestAsync(Guid requestId, ReviewReopenDTO request)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
            {
                throw new UnauthorizedAccessException("Invalid user session.");
            }
            var loggedInAccountId = Guid.Parse(accountIdClaim);
            var permissions = httpContextAccessor.HttpContext?.User.FindAll("Permission").Select(c => c.Value).ToList() ?? new List<string>();

            if (!permissions.Contains("Permissions.Tasks.Manage"))
            {
                throw new UnauthorizedAccessException("Only Operations Admin can review reopen requests.");
            }

            var reopenReq = await context.TaskReopenRequests
                .Include(r => r.Task)
                    .ThenInclude(t => t.Assignee)
                        .ThenInclude(a => a.Employee)
                .Include(r => r.Task)
                    .ThenInclude(t => t.Creator)
                        .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (reopenReq == null)
            {
                throw new Exception("Reopen request not found.");
            }

            if (reopenReq.Status != "Pending")
            {
                throw new Exception($"Request has already been {reopenReq.Status.ToLower()}.");
            }

            if (request.ApprovalDecision != "Approve" && request.ApprovalDecision != "Reject")
            {
                throw new Exception("Decision must be either 'Approve' or 'Reject'.");
            }

            if (string.IsNullOrWhiteSpace(request.AdminRemarks))
            {
                throw new Exception("Admin remarks are required.");
            }

            if (request.AdminRemarks.Length > 500)
            {
                throw new Exception("Admin remarks must not exceed 500 characters.");
            }

            reopenReq.Status = request.ApprovalDecision;
            reopenReq.AdminRemarks = request.AdminRemarks;

            if (request.ApprovalDecision == "Approve")
            {
                reopenReq.Task.TaskStatus = "In Progress";
                reopenReq.Task.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                loggedInAccountId,
                "Task Reopen Reviewed",
                $"Reopen request for Task '{reopenReq.Task.TaskTitle}' was {request.ApprovalDecision.ToLower()}ed. Remarks: {request.AdminRemarks}");

            await notificationService.CreateGeneralNotificationAsync(reopenReq.RequestedById, "Task Reopen Decision", $"Your reopen request for Task '{reopenReq.Task.TaskTitle}' was {request.ApprovalDecision.ToLower()}ed.");

            return new TaskResponseDTO
            {
                TaskId = reopenReq.Task.TaskId,
                TaskTitle = reopenReq.Task.TaskTitle,
                TaskDescription = reopenReq.Task.TaskDescription,
                Priority = reopenReq.Task.Priority,
                DueAt = reopenReq.Task.DueAt,
                TaskStatus = reopenReq.Task.TaskStatus,
                AssignedEmployee = string.Join(" ", new[] { reopenReq.Task.Assignee.Employee.FirstName, reopenReq.Task.Assignee.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))),
                CreatedByEmployee = string.Join(" ", new[] { reopenReq.Task.Creator.Employee.FirstName, reopenReq.Task.Creator.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))),
                CreatedAt = reopenReq.Task.CreatedAt,
                IsDeleted = reopenReq.Task.Deleted
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

            bool isAdmin = permissions.Contains("Permissions.Tasks.Manage");

            // SECURITY CHECK
            // Only assigned employee can update progress (admins bypass for approvals)
            if (!isAdmin && task.AssignedTo != loggedInAccountId)
            {
                throw new UnauthorizedAccessException(
                    "You can only update tasks assigned to you.");
            }

            // Immutability Check for Completed Tasks
            if (task.TaskStatus == "Completed")
            {
                throw new Exception("This task is completed and immutable. To make any changes, an Admin permission is required, or you must reopen the task first.");
            }

            // Intercept action and explicitly prevent status from changing to "Completed" for non-admins
            if (request.TaskStatus == "Completed" && !isAdmin)
            {
                request.TaskStatus = "Pending Admin Review";
            }

            // FSM Validation
            bool isStatusChanged = task.TaskStatus != request.TaskStatus;
            if (isStatusChanged)
            {
                bool isValidTransition = false;
                string failureReason = "";

                if (task.TaskStatus == "Assigned" && request.TaskStatus == "In Progress")
                {
                    isValidTransition = true;
                }
                else if (task.TaskStatus == "In Progress" && request.TaskStatus == "Pending Admin Review")
                {
                    if (string.IsNullOrWhiteSpace(request.ProgressNotes))
                    {
                        throw new Exception("Completion notes are required to submit for review.");
                    }
                    isValidTransition = true;
                }
                else if (task.TaskStatus == "In Progress" && request.TaskStatus == "Done")
                {
                    isValidTransition = true;
                }
                else if (task.TaskStatus == "Done" && request.TaskStatus == "Completed" && isAdmin)
                {
                    isValidTransition = true;
                }
                else
                {
                    failureReason = $"Invalid transition from {task.TaskStatus} to {request.TaskStatus}.";
                }

                if (!isValidTransition)
                {
                    await RecordTaskStatusAsync(task.TaskId, task.TaskStatus, request.TaskStatus, loggedInAccountId, false, failureReason);
                    throw new Exception(failureReason);
                }
                
                await RecordTaskStatusAsync(task.TaskId, task.TaskStatus, request.TaskStatus, loggedInAccountId, true);
                task.TaskStatus = request.TaskStatus;
            }

            if (!string.IsNullOrWhiteSpace(request.TaskRemarks))
            {
                task.TaskRemarks = request.TaskRemarks;
            }

            if (!string.IsNullOrWhiteSpace(request.ProgressNotes))
            {
                task.ProgressNotes = request.ProgressNotes;
            }

            if (!string.IsNullOrWhiteSpace(request.ProgressNotes) && request.ProgressNotes.Length > 1000)
            {
                throw new Exception("Progress notes must not exceed 1000 characters.");
            }

            if (!string.IsNullOrWhiteSpace(request.TaskRemarks) && request.TaskRemarks.Length > 1000)
            {
                throw new Exception("Remarks must not exceed 1000 characters.");
            }

            if (request.SupportingEvidence != null)
            {
                var allowedTypes = new[] { "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png" };
                if (!allowedTypes.Contains(request.SupportingEvidence.ContentType))
                {
                    throw new Exception("Only PDF, DOCX, XLSX, JPG, and PNG files are allowed.");
                }
                if (request.SupportingEvidence.Length > 20 * 1024 * 1024)
                {
                    throw new Exception("File size must not exceed 20MB.");
                }
                task.ProgressEvidenceUrl = await fileService.UploadFileAsync(request.SupportingEvidence, "task_evidence");
            }

            task.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            // For Notification
            if (task.TaskStatus == "Completed")
            {
                await notificationService
                    .CreateCompletedTaskUpdateNotificationAsync(task);
            }
            else if (task.TaskStatus == "Pending Admin Review")
            {
                await notificationService
                    .CreateTaskReviewRequestedNotificationAsync(task);
            }
            else
            {
                await notificationService
                    .CreateEmployeeTaskUpdateNotificationAsync(task);
            }

            await activityLogService.LogActivityAsync(
                task.AssignedTo.Value,
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
                .OrderByDescending(t => t.Priority == "Critical" ? 4 :
                                        t.Priority == "High" ? 3 :
                                        t.Priority == "Medium" ? 2 :
                                        t.Priority == "Low" ? 1 : 0)
                .ThenBy(t => t.DueAt);

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
                    IsRecommended = false,
                    AvailabilityStatus = "Active",
                    RecommendationReason = string.Empty
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
                        emp.RecommendationReason = $"Employee has the lowest active workload ({emp.ActiveTaskCount} tasks) and is currently Active.";
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

        public async Task<ApiResponseDTO<PaginationResponseDTO<TaskResponseDTO>>> SearchTasksAsync(TaskSearchDTO request)
        {
            var query = context.Tasks
                .Include(t => t.Assignee).ThenInclude(a => a.Employee)
                .Include(t => t.Creator).ThenInclude(c => c.Employee)
                .Where(t => !t.Deleted && !t.PermanentlyDeleted)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.TaskTitle))
            {
                query = query.Where(t => t.TaskTitle.Contains(request.TaskTitle));
            }

            if (request.AssignedEmployee.HasValue)
            {
                query = query.Where(t => t.AssignedTo == request.AssignedEmployee.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.TaskStatus))
            {
                query = query.Where(t => t.TaskStatus == request.TaskStatus);
            }

            if (!string.IsNullOrWhiteSpace(request.PriorityLevel))
            {
                query = query.Where(t => t.Priority == request.PriorityLevel);
            }

            if (!string.IsNullOrWhiteSpace(request.TaskCategory))
            {
                query = query.Where(t => t.TaskCategory == request.TaskCategory);
            }

            if (request.DeadlineDate.HasValue)
            {
                query = query.Where(t => t.DueAt.HasValue && t.DueAt.Value.Date == request.DeadlineDate.Value.Date);
            }

            if (request.DeadlineStartDate.HasValue)
            {
                query = query.Where(t => t.DueAt.HasValue && t.DueAt.Value.Date >= request.DeadlineStartDate.Value.Date);
            }

            if (request.DeadlineEndDate.HasValue)
            {
                query = query.Where(t => t.DueAt.HasValue && t.DueAt.Value.Date <= request.DeadlineEndDate.Value.Date);
            }

            bool isDescending = string.Equals(request.SortOrder, "Descending", StringComparison.OrdinalIgnoreCase);

            switch (request.SortBy?.ToLower())
            {
                case "task title":
                    query = isDescending ? query.OrderByDescending(t => t.TaskTitle) : query.OrderBy(t => t.TaskTitle);
                    break;
                case "deadline":
                    query = isDescending ? query.OrderByDescending(t => t.DueAt) : query.OrderBy(t => t.DueAt);
                    break;
                case "priority level":
                    if (isDescending)
                    {
                        query = query.OrderBy(t => t.Priority == "Critical" ? 4 :
                                                   t.Priority == "High" ? 3 :
                                                   t.Priority == "Medium" ? 2 :
                                                   t.Priority == "Low" ? 1 : 0)
                                     .ThenByDescending(t => t.DueAt);
                    }
                    else
                    {
                        query = query.OrderByDescending(t => t.Priority == "Critical" ? 4 :
                                                             t.Priority == "High" ? 3 :
                                                             t.Priority == "Medium" ? 2 :
                                                             t.Priority == "Low" ? 1 : 0)
                                     .ThenBy(t => t.DueAt);
                    }
                    break;
                case "status":
                    query = isDescending ? query.OrderByDescending(t => t.TaskStatus) : query.OrderBy(t => t.TaskStatus);
                    break;
                case "assigned employee":
                    query = isDescending ? query.OrderByDescending(t => t.Assignee.Employee.FirstName) : query.OrderBy(t => t.Assignee.Employee.FirstName);
                    break;
                default:
                    query = query.OrderByDescending(t => t.Priority == "Critical" ? 4 :
                                                         t.Priority == "High" ? 3 :
                                                         t.Priority == "Medium" ? 2 :
                                                         t.Priority == "Low" ? 1 : 0)
                                 .ThenBy(t => t.DueAt);
                    break;
            }

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
                    AssignedEmployee = string.Join(" ", new[] { t.Assignee.Employee.FirstName, t.Assignee.Employee.MiddleName, t.Assignee.Employee.LastName, t.Assignee.Employee.Suffix }.Where(n => !string.IsNullOrEmpty(n))),
                    CreatedByEmployee = string.Join(" ", new[] { t.Creator.Employee.FirstName, t.Creator.Employee.MiddleName, t.Creator.Employee.LastName, t.Creator.Employee.Suffix }.Where(n => !string.IsNullOrEmpty(n))),
                    CreatedAt = t.CreatedAt
                }).ToListAsync();

            if (!data.Any())
            {
                return new ApiResponseDTO<PaginationResponseDTO<TaskResponseDTO>>
                {
                    IsSuccess = false,
                    Message = "No matching task records found.",
                    Data = null
                };
            }

            return new ApiResponseDTO<PaginationResponseDTO<TaskResponseDTO>>
            {
                IsSuccess = true,
                Message = "Matching records displayed.",
                Data = new PaginationResponseDTO<TaskResponseDTO>
                {
                    Data = data,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalRecords = totalRecords,
                    TotalPages = (int)Math.Ceiling(totalRecords / (double)request.PageSize)
                }
            };
        }

        public async Task<TaskResponseDTO> ReviewTaskAsync(Guid taskId, ReviewTaskDTO request)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim)) throw new UnauthorizedAccessException("Invalid user session.");
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            // Get Logged-In User Permissions
            var permissions = httpContextAccessor.HttpContext?.User.FindAll("Permission").Select(c => c.Value).ToList() ?? new List<string>();
            if (!permissions.Contains("Permissions.Tasks.Manage"))
            {
                throw new UnauthorizedAccessException("Access Denied: You do not have permission to close this task.");
            }

            var task = await context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && !t.Deleted && !t.PermanentlyDeleted);

            if (task == null) throw new Exception("Task not found.");

            if (task.TaskStatus != "Pending Admin Review")
            {
                string failureReason = $"Cannot review task. Task is not in 'Pending Admin Review' state. Current status: '{task.TaskStatus}'.";
                await RecordTaskStatusAsync(taskId, task.TaskStatus, request.AdminDecision == "Approve & Close" ? "Completed" : "In Progress", loggedInAccountId, false, failureReason);
                throw new Exception(failureReason);
            }

            if (request.AdminDecision == "Approve & Close")
            {
                task.TaskStatus = "Completed";
                task.UpdatedAt = DateTime.UtcNow;

                await RecordTaskStatusAsync(taskId, "Pending Admin Review", "Completed", loggedInAccountId, true);
                await context.SaveChangesAsync();

                await notificationService.CreateTaskApprovedAndClosedNotificationAsync(task);
                await activityLogService.LogActivityAsync(loggedInAccountId, "Task Completed", $"Operations Admin verified and completed task '{task.TaskTitle}'.");
            }
            else if (request.AdminDecision == "Return for Rework")
            {
                if (string.IsNullOrWhiteSpace(request.ReviewerRemarks))
                {
                    throw new Exception("Reviewer Remarks are required when returning a task for rework.");
                }

                task.TaskStatus = "In Progress";
                task.TaskRemarks = string.IsNullOrWhiteSpace(task.TaskRemarks) 
                    ? request.ReviewerRemarks 
                    : $"{task.TaskRemarks}\n\n[Admin Rework Review]: {request.ReviewerRemarks}";
                task.UpdatedAt = DateTime.UtcNow;

                await RecordTaskStatusAsync(taskId, "Pending Admin Review", "In Progress", loggedInAccountId, true);
                await context.SaveChangesAsync();

                await notificationService.CreateTaskReturnedForReworkNotificationAsync(task);
                await activityLogService.LogActivityAsync(loggedInAccountId, "Task Returned for Rework", $"Operations Admin returned task '{task.TaskTitle}' for rework.");
            }
            else
            {
                throw new Exception("Invalid Admin Decision.");
            }

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskStatus = task.TaskStatus,
                AssignedEmployee = string.Join(" ", new[] { task.Assignee?.Employee.FirstName, task.Assignee?.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))),
                CreatedByEmployee = string.Join(" ", new[] { task.Creator.Employee.FirstName, task.Creator.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))),
                CreatedAt = task.CreatedAt
            };
        }

        public async Task<List<ReopenRequestListDTO>> GetReopenRequestsAsync()
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
            {
                throw new UnauthorizedAccessException("Invalid user session.");
            }
            var permissions = httpContextAccessor.HttpContext?.User.FindAll("Permission").Select(c => c.Value).ToList() ?? new List<string>();
            if (!permissions.Contains("Permissions.Tasks.Manage"))
            {
                throw new UnauthorizedAccessException("Only Operations Admin can view reopen requests.");
            }

            var requests = await context.TaskReopenRequests
                .Include(r => r.Task)
                .Include(r => r.RequestedBy)
                    .ThenInclude(a => a.Employee)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReopenRequestListDTO
                {
                    RequestId = r.RequestId,
                    TaskId = r.TaskId,
                    TaskTitle = r.Task.TaskTitle,
                    EmployeeName = string.Join(" ", new[] { r.RequestedBy.Employee.FirstName, r.RequestedBy.Employee.MiddleName, r.RequestedBy.Employee.LastName, r.RequestedBy.Employee.Suffix }.Where(n => !string.IsNullOrEmpty(n))),
                    EmployeeId = r.RequestedBy.Employee.EmployeeNumber,
                    Reason = r.Reason,
                    SupportingEvidence = r.EvidenceUrl,
                    CurrentStatus = r.Task.TaskStatus,
                    Status = r.Status,
                    SubmittedAt = r.CreatedAt,
                    ReviewedAt = null,
                    AdminRemarks = r.AdminRemarks
                })
                .ToListAsync();

            return requests;
        }

        public async Task<TaskResponseDTO> OverrideCompletedTaskAsync(Guid taskId, AdminOverrideDTO request)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim)) throw new UnauthorizedAccessException("Invalid user session.");
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            if (!request.ApprovalConfirmation)
            {
                throw new Exception("Approval confirmation is required to perform an admin override.");
            }

            var task = await context.Tasks
                .Include(t => t.Assignee)
                    .ThenInclude(a => a.Employee)
                .Include(t => t.Creator)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && !t.Deleted && !t.PermanentlyDeleted);

            if (task == null) throw new Exception("Task not found.");

            if (task.TaskStatus != "Completed")
            {
                throw new Exception("Admin override can only be applied to Completed tasks.");
            }

            var validRequestedStatuses = new[] { "Assigned", "In Progress", "Done" };
            if (!validRequestedStatuses.Contains(request.RequestedStatus))
            {
                throw new Exception($"Invalid requested status. Must be one of: {string.Join(", ", validRequestedStatuses)}");
            }

            // Create override record
            var overrideRecord = new AdminOverrideRecord
            {
                OverrideId = Guid.NewGuid(),
                TaskId = taskId,
                AdminId = loggedInAccountId,
                OverrideReason = request.OverrideReason,
                AdminRemarks = request.AdminRemarks,
                ApprovalConfirmation = request.ApprovalConfirmation,
                CreatedAt = DateTime.UtcNow
            };

            await context.AdminOverrideRecords.AddAsync(overrideRecord);

            var oldStatus = task.TaskStatus;
            task.TaskStatus = request.RequestedStatus;
            task.UpdatedAt = DateTime.UtcNow;

            await RecordTaskStatusAsync(taskId, oldStatus, task.TaskStatus, loggedInAccountId, true, "Admin Override Executed");
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(loggedInAccountId, "Task Override", $"Operations Admin overrode task '{task.TaskTitle}' from Completed to {task.TaskStatus}. Reason: {request.OverrideReason}");

            return new TaskResponseDTO
            {
                TaskId = task.TaskId,
                TaskTitle = task.TaskTitle,
                TaskStatus = task.TaskStatus,
                AssignedEmployee = string.Join(" ", new[] { task.Assignee?.Employee.FirstName, task.Assignee?.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))),
                CreatedByEmployee = string.Join(" ", new[] { task.Creator.Employee.FirstName, task.Creator.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))),
                CreatedAt = task.CreatedAt
            };
        }

        private async System.Threading.Tasks.Task RecordTaskStatusAsync(Guid taskId, string currentStatus, string requestedStatus, Guid accountId, bool isSuccessful, string? failureReason = null)
        {
            var statusRecord = new TaskStatusRecord
            {
                RecordId = Guid.NewGuid(),
                TaskId = taskId,
                CurrentStatus = currentStatus,
                RequestedStatus = requestedStatus,
                ChangeDate = DateTime.UtcNow,
                UpdatedBy = accountId,
                IsSuccessful = isSuccessful,
                FailureReason = failureReason
            };

            await context.TaskStatusRecords.AddAsync(statusRecord);
            await context.SaveChangesAsync();

            string statusLogMsg = isSuccessful
                ? $"Status transition validated: '{currentStatus}' -> '{requestedStatus}'."
                : $"Status sequence violation detected: Failed to transition from '{currentStatus}' to '{requestedStatus}'. Reason: {failureReason}";

            await activityLogService.LogActivityAsync(
                accountId,
                isSuccessful ? ActivityTypes.TaskStatusUpdated : ActivityTypes.TaskStatusUpdateFailed,
                statusLogMsg
            );
        }
    }
}
