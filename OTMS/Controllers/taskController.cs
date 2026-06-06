using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.DTOs.Task;
using OTMS.Entities.DTOs.Task.Responses;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class taskController(ITaskService taskService) : ControllerBase
    {

        /// <summary>
        /// Creates a new task and assigns it to an employee. Only OperationsAdmin users can create tasks.
        /// </summary>
        [Authorize(Policy = "OperationAdminAccess")]
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
        [Authorize(Policy = "OperationAdminAccess")]
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
        [Authorize(Policy = "OperationAdminAccess")]
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
        [Authorize(Policy = "OperationalTeamAccess")]
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
        [Authorize(Policy = "OperationalTeamAccess")]
        [HttpGet("my-tasks")]
        public async Task<ActionResult<PaginationResponseDTO<TaskResponseDTO>>> GetMyTasks(PaginationDTO request)
        {
            try
            {
                var result = await taskService.GetMyTasksAsync(request);

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
        [Authorize(Policy = "OperationAdminAccess")]
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
                    .Where(t =>
                        !t.Deleted
                        && !t.PermanentlyDeleted)
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

        /// <summary>
        /// Deletes a task by its ID. Only authenticated users with the "OperationsAdmin" role can delete tasks. The endpoint will return a success message if the task is deleted, or a not found message if the task does not exist. If an error occurs during deletion, it will return a bad request with the error message.
        /// </summary>
        [Authorize(Policy = "OperationAdminAccess")]
        [HttpDelete("{taskId}/delete-task")]
        public async Task<IActionResult> DeleteTask(Guid taskId)
        {
            try
            {
                var result = await taskService.DeleteTaskAsync(taskId);
                if (result.IsDeleted)
                {
                    return Ok(result);
                }
                else
                {
                    return NotFound(result);
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "OperationAdminAccess")]
        [HttpPost("{taskId}/restore-task")]
        public async Task<IActionResult> RestoreTask(Guid taskId)
        {
            try
            {
                var result = await taskService.RestoreTaskAsync(taskId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [Authorize(Policy = "OperationalTeamAccess")]
        [HttpGet("bin-records/{employeeId}")]
        public async Task<IActionResult> BinRecords(string employeeId, PaginationDTO pagination)
        {
            try
            {
                var result = await taskService.BinRecordsAsync(employeeId, pagination);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [Authorize(Policy = "OperationAdminAccess")]
        [HttpDelete("empty-bin/{employeeId}")]
        public async Task<IActionResult> EmptyBin(string employeeId)
        {
            try
            {
                var result = await taskService.EmptyBinAsync(employeeId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = ex.Message,
                    Data = null
                });
            }













        }
    }
}
