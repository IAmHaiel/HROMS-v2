using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Data;
using OTMS.Entities.DTOs.Task;
using OTMS.Entities.DTOs.Task.Responses;
using OTMS.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class taskController(ITaskService taskService) : ControllerBase
    {

        /// <summary>
        /// Creates a new task and assigns it to an employee. Only OperationsAdmin users can create tasks.
        /// </summary>
        [Authorize(Roles = "OperationAdmin")]
        [HttpPost("create-task")]
        public async Task<ActionResult<TaskResponseDTO>> CreateTask(
            CreateTaskDTO request)
        {
            try
            {
                var result = await taskService.CreateTaskAsync(request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        /// <summary>
        /// Updates an existing task's details. Only authenticated users can update tasks, and only if they have the "OperationsAdmin" role.
        /// </summary>
        [Authorize(Roles = "OperationAdmin")]
        [HttpPut("update-task/{taskId}")]
        public async Task<ActionResult<TaskResponseDTO>> UpdateTask(Guid taskId, UpdateTaskDTO request)
        {
            try
            {
                var result = await taskService.UpdateTaskAsync(
                    taskId,
                    request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        /// <summary>
        /// Reopens a completed or closed task, changing its status back to "Pending". Only authenticated users with the "OperationsAdmin" role can reopen tasks.
        /// </summary>
        [Authorize(Roles = "OperationAdmin")]
        [HttpPatch("{taskId}/reopen")]
        public async Task<ActionResult<TaskResponseDTO>> ReopenTask(Guid taskId)
        {
            try
            {
                var result = await taskService.ReopenTaskAsync(taskId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        /// <summary>
        /// Updates the progress of a task, allowing the assigned employee to change the task's status and add remarks. Only authenticated users with the "OperationsAdmin", "Encoder", or "Coordinator" roles can update task progress, and they can only update tasks that are assigned to them.
        /// </summary>
        [Authorize(Roles = "OperationAdmin,Encoder,Coordinator")]
        [HttpPatch("{taskId}/progress")]
        public async Task<ActionResult<TaskResponseDTO>> UpdateTaskProgress(Guid taskId, UpdateTaskProgressDTO request)
        {
            try
            {
                var result = await taskService.UpdateTaskProgressAsync(taskId, request);

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new
                {
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        /// <summary>
        /// Gets a list of tasks that are assigned to the currently authenticated user. Only authenticated users with the "OperationsAdmin", "Encoder", or "Coordinator" roles can access this endpoint, and they will only see tasks that are assigned to them.
        /// </summary>
        [Authorize(Roles = "OperationAdmin,Encoder,Coordinator")]
        [HttpGet("my-tasks")]
        public async Task<ActionResult<List<TaskResponseDTO>>> GetMyTasks()
        {
            try
            {
                var result = await taskService.GetMyTasksAsync();

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new
                {
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        /// <summary>
        /// Gets all tasks. Only accessible to OperationAdmin.
        /// </summary>
        [Authorize(Roles = "OperationAdmin")]
        [HttpGet("all-tasks")]
        public async Task<ActionResult<List<TaskResponseDTO>>> GetAllTasks([FromServices] OTMSDbContext context)
        {
            try
            {
                var tasks = await context.Tasks
                    .Include(t => t.Assignee)
                        .ThenInclude(a => a.Employee)
                    .Include(t => t.Creator)
                        .ThenInclude(a => a.Employee)
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new TaskResponseDTO
                    {
                        TaskId = t.TaskId,
                        TaskTitle = t.TaskTitle,
                        TaskDescription = t.TaskDescription,
                        Priority = t.Priority,
                        DueAt = t.DueAt,
                        TaskStatus = t.TaskStatus,
                        AssignedEmployee = t.Assignee.Employee.EmployeeName,
                        CreatedByEmployee = t.Creator.Employee.EmployeeName,
                        CreatedAt = t.CreatedAt
                    })
                    .ToListAsync();

                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

    }
}
