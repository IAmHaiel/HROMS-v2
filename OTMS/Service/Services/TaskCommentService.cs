using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs.TaskComment;
using OTMS.Entities.DTOs.TaskComment.Responses;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Service.Services
{
    public class TaskCommentService(
        OTMSDbContext context,
        IHttpContextAccessor httpContextAccessor,
        IActivityLogService activityLogService,
        IFileService fileService) : ITaskCommentService
    {
        public async Task<TaskCommentResponseDTO> CreateCommentAsync(CreateTaskCommentDTO request)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim)) throw new UnauthorizedAccessException("Invalid user session.");
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            var task = await context.Tasks.FirstOrDefaultAsync(t => t.TaskId == request.TaskId && !t.Deleted && !t.PermanentlyDeleted);
            if (task == null) throw new Exception("Task not found.");

            string? attachmentUrl = null;
            if (request.Attachment != null)
            {
                var allowedExtensions = new[] { ".pdf", ".docx", ".xlsx", ".jpg", ".png", ".jpeg" };
                var extension = Path.GetExtension(request.Attachment.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    throw new Exception("Invalid file type. Allowed types are PDF, DOCX, XLSX, JPG, PNG.");
                }

                if (request.Attachment.Length > 20 * 1024 * 1024)
                {
                    throw new Exception("Attachment exceeds maximum size of 20MB.");
                }

                attachmentUrl = await fileService.UploadFileAsync(request.Attachment, "task_comments");
            }

            var comment = new TaskComment
            {
                TaskCommentId = Guid.NewGuid(),
                EmployeeId = loggedInAccountId,
                TaskId = request.TaskId,
                Message = request.Message,
                AttachmentUrl = attachmentUrl,
                CreatedAt = DateTime.UtcNow
            };

            await context.TaskComments.AddAsync(comment);
            await context.SaveChangesAsync();

            var author = await context.Accounts.Include(a => a.Employee).FirstOrDefaultAsync(a => a.AccountId == loggedInAccountId);

            await activityLogService.LogActivityAsync(loggedInAccountId, ActivityTypes.TaskCommentAdded, $"Added a comment to task '{task.TaskTitle}'.");

            return new TaskCommentResponseDTO
            {
                TaskCommentId = comment.TaskCommentId,
                TaskId = comment.TaskId,
                EmployeeId = comment.EmployeeId,
                AuthorName = author != null ? string.Join(" ", new[] { author.Employee.FirstName, author.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))) : "Unknown User",
                Message = comment.Message,
                AttachmentUrl = comment.AttachmentUrl,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt
            };
        }

        public async Task<TaskCommentResponseDTO> UpdateCommentAsync(Guid commentId, UpdateTaskCommentDTO request)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim)) throw new UnauthorizedAccessException("Invalid user session.");
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            var comment = await context.TaskComments
                .Include(c => c.Employee)
                .Include(c => c.Task)
                .FirstOrDefaultAsync(c => c.TaskCommentId == commentId);

            if (comment == null) throw new Exception("Comment not found.");

            if (comment.EmployeeId != loggedInAccountId)
            {
                throw new UnauthorizedAccessException("Unauthorized comment modification. You can only edit your own comments.");
            }

            comment.Message = request.Message;
            comment.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(loggedInAccountId, ActivityTypes.TaskCommentUpdated, $"Updated a comment on task '{comment.Task.TaskTitle}'.");

            var authorAccount = await context.Accounts.Include(a => a.Employee).FirstOrDefaultAsync(a => a.AccountId == comment.EmployeeId);

            return new TaskCommentResponseDTO
            {
                TaskCommentId = comment.TaskCommentId,
                TaskId = comment.TaskId,
                EmployeeId = comment.EmployeeId,
                AuthorName = authorAccount != null ? string.Join(" ", new[] { authorAccount.Employee.FirstName, authorAccount.Employee.LastName }.Where(n => !string.IsNullOrEmpty(n))) : "Unknown User",
                Message = comment.Message,
                AttachmentUrl = comment.AttachmentUrl,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt
            };
        }

        public async Task<bool> DeleteCommentAsync(Guid commentId)
        {
            var accountIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdClaim)) throw new UnauthorizedAccessException("Invalid user session.");
            var loggedInAccountId = Guid.Parse(accountIdClaim);

            var comment = await context.TaskComments
                .Include(c => c.Task)
                .FirstOrDefaultAsync(c => c.TaskCommentId == commentId);

            if (comment == null) throw new Exception("Comment not found.");

            if (comment.EmployeeId != loggedInAccountId)
            {
                throw new UnauthorizedAccessException("Unauthorized comment modification. You can only delete your own comments.");
            }

            string taskTitle = comment.Task.TaskTitle;

            context.TaskComments.Remove(comment);
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(loggedInAccountId, ActivityTypes.TaskCommentDeleted, $"Deleted a comment from task '{taskTitle}'.");

            return true;
        }

        public async Task<IEnumerable<TaskCommentResponseDTO>> GetCommentsByTaskAsync(Guid taskId)
        {
            var task = await context.Tasks.FirstOrDefaultAsync(t => t.TaskId == taskId && !t.Deleted && !t.PermanentlyDeleted);
            if (task == null) throw new Exception("Task not found.");

            var comments = await context.TaskComments
                .Include(c => c.Employee)
                .Where(c => c.TaskId == taskId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            var authorIds = comments.Select(c => c.EmployeeId).Distinct().ToList();
            var authors = await context.Accounts
                .Include(a => a.Employee)
                .Where(a => authorIds.Contains(a.AccountId))
                .ToDictionaryAsync(a => a.AccountId, a => a.Employee);

            return comments.Select(c => new TaskCommentResponseDTO
            {
                TaskCommentId = c.TaskCommentId,
                TaskId = c.TaskId,
                EmployeeId = c.EmployeeId,
                AuthorName = authors.ContainsKey(c.EmployeeId) ? string.Join(" ", new[] { authors[c.EmployeeId].FirstName, authors[c.EmployeeId].LastName }.Where(n => !string.IsNullOrEmpty(n))) : "Unknown User",
                Message = c.Message,
                AttachmentUrl = c.AttachmentUrl,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            });
        }
    }
}
