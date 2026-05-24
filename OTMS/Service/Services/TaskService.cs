using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.Task;
using OTMS.Entities.DTOs.Task.Responses;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Service.Services
{
    public class TaskService(OTMSDbContext context, IHttpContextAccessor httpContextAccessor) : ITaskService
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
    }
}
