using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Exceptions;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.DTOs.Task;
using OTMS.Entities.DTOs.Task.Responses;
using OTMS.Entities.Models;
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
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        [HttpPost("create-task")]
        public async Task<ActionResult<TaskResponseDTO>> CreateTask(
            CreateTaskDTO request)
        {
            try
            {
                var result = await taskService.CreateTaskAsync(request);

                return Ok(result);
            }
            catch (DuplicateTaskException ex)
            {
                return Conflict(new ApiResponseDTO<List<DuplicateTaskWarningDTO>>
                {
                    IsSuccess = false,
                    Message = ex.Message,
                    Data = ex.Duplicates
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
        /// Updates an existing task's details. Only authenticated users can update tasks, and only if they have the "OperationsAdmin" role.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.Manage")]
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
        /// Requests reopening of a completed task.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.View")]
        [HttpPost("{taskId}/reopen-request")]
        public async Task<ActionResult<TaskResponseDTO>> RequestReopenTask(Guid taskId, [FromForm] RequestReopenDTO request)
        {
            try
            {
                var result = await taskService.RequestReopenTaskAsync(taskId, request);

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
        /// Reviews a task reopen request (Approve/Reject).
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        [HttpPatch("reopen-requests/{requestId}/review")]
        public async Task<ActionResult<TaskResponseDTO>> ReviewReopenRequest(Guid requestId, ReviewReopenDTO request)
        {
            try
            {
                var result = await taskService.ReviewReopenRequestAsync(requestId, request);

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
        [Authorize(Policy = "Permissions.Tasks.View")]
        [HttpPatch("{taskId}/progress")]
        public async Task<ActionResult<TaskResponseDTO>> UpdateTaskProgress(Guid taskId, [FromForm] UpdateTaskProgressDTO request)
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
        /// Operations Admin reviews a "Pending Admin Review" task.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        [HttpPost("{taskId}/review")]
        public async Task<ActionResult<TaskResponseDTO>> ReviewTask(Guid taskId, [FromBody] ReviewTaskDTO request)
        {
            try
            {
                var result = await taskService.ReviewTaskAsync(taskId, request);
                var message = request.AdminDecision == "Approve & Close" ? "Task officially closed and recorded." : "Task returned for rework.";
                return Ok(new { message = message, data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Gets all reopen requests for review by Operations Admin.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        [HttpGet("reopen-requests")]
        public async Task<ActionResult<List<ReopenRequestListDTO>>> GetReopenRequests()
        {
            try
            {
                var result = await taskService.GetReopenRequestsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// System/Operations Admin overrides a "Completed" task, providing reasons and unlocking its status.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        [HttpPost("{taskId}/override")]
        public async Task<ActionResult<TaskResponseDTO>> OverrideCompletedTask(Guid taskId, [FromBody] AdminOverrideDTO request)
        {
            try
            {
                var result = await taskService.OverrideCompletedTaskAsync(taskId, request);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Gets a list of tasks that are assigned to the currently authenticated user. Only authenticated users with the "OperationsAdmin", "Encoder", or "Coordinator" roles can access this endpoint, and they will only see tasks that are assigned to them.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.View")]
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
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        [HttpGet("all-tasks")]
        public async Task<ActionResult<PaginationResponseDTO<TaskResponseDTO>>> GetAllTasks([FromServices] OTMSDbContext context, [FromQuery] PaginationDTO pagination)
        {
            try
            {
                var query = context.Tasks
                    .Include(t => t.Assignee)
                        .ThenInclude(a => a.Employee)
                    .Include(t => t.Creator)
                        .ThenInclude(c => c.Employee)
                    .Where(t => !t.Deleted && !t.PermanentlyDeleted)
                    .OrderByDescending(t => t.Priority == "Critical" ? 4 :
                                            t.Priority == "High" ? 3 :
                                            t.Priority == "Medium" ? 2 :
                                            t.Priority == "Low" ? 1 : 0)
                    .ThenBy(t => t.DueAt);

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
                        CreatedAt = t.CreatedAt
                    }).ToListAsync();

                return Ok(new PaginationResponseDTO<TaskResponseDTO>
                {
                    IsSuccess = true,
                    Message = "Tasks retrieved successfully",
                    Data = data,
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalRecords = totalRecords,
                    TotalPages = (int)Math.Ceiling(totalRecords / (double)pagination.PageSize)
                });


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

        /// <summary>
        /// Searches, filters, and sorts tasks dynamically.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        [HttpGet("search")]
        public async Task<ActionResult<PaginationResponseDTO<TaskResponseDTO>>> SearchTasks([FromQuery] TaskSearchDTO request)
        {
            try
            {
                var result = await taskService.SearchTasksAsync(request);

                if (result.IsSuccess)
                {
                    return Ok(result.Data);
                }

                return BadRequest(new { message = result.Message });
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

        /// <summary>
        /// Deletes a task by its ID. Only authenticated users with the "OperationsAdmin" role can delete tasks. The endpoint will return a success message if the task is deleted, or a not found message if the task does not exist. If an error occurs during deletion, it will return a bad request with the error message.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.Manage")]
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

        [Authorize(Policy = "Permissions.Tasks.Manage")]
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

        [Authorize(Policy = "Permissions.Tasks.View")]
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

        [Authorize(Policy = "Permissions.Tasks.Manage")]
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

        /// <summary>
        /// Gets smart routing recommendations for task assignment, excluding offline and on-leave employees.
        /// Suggests the most appropriate employee based on their current active task load.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        [HttpGet("assignable-employees")]
        public async Task<IActionResult> GetAssignableEmployees([FromQuery] PaginationDTO pagination, [FromQuery] string? nameFilter)
        {
            try
            {
                var result = await taskService.GetAssignableEmployeesAsync(pagination, nameFilter);
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