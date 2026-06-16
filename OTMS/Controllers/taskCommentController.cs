using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.TaskComment;
using OTMS.Service.Interfaces;
using System;
using System.Threading.Tasks;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class taskCommentController(ITaskCommentService taskCommentService) : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> CreateComment([FromForm] CreateTaskCommentDTO request)
        {
            try
            {
                var response = await taskCommentService.CreateCommentAsync(request);
                return Ok(new { message = "Comment added successfully.", data = response });
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

        [HttpPut("{commentId}")]
        public async Task<IActionResult> UpdateComment(Guid commentId, [FromBody] UpdateTaskCommentDTO request)
        {
            try
            {
                var response = await taskCommentService.UpdateCommentAsync(commentId, request);
                return Ok(new { message = "Comment updated successfully.", data = response });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                if (ex.Message == "Comment not found.")
                {
                    return NotFound(new { message = ex.Message });
                }
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{commentId}")]
        public async Task<IActionResult> DeleteComment(Guid commentId)
        {
            try
            {
                await taskCommentService.DeleteCommentAsync(commentId);
                return Ok(new { message = "Comment deleted successfully." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                if (ex.Message == "Comment not found.")
                {
                    return NotFound(new { message = ex.Message });
                }
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("task/{taskId}")]
        public async Task<IActionResult> GetCommentsByTask(Guid taskId)
        {
            try
            {
                var response = await taskCommentService.GetCommentsByTaskAsync(taskId);
                return Ok(new { message = "Chronological comment history displayed.", data = response });
            }
            catch (Exception ex)
            {
                if (ex.Message == "Task not found." || ex.Message == "No comments available.")
                {
                    return NotFound(new { message = ex.Message });
                }
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
