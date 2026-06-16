using System;

namespace OTMS.Entities.DTOs.TaskComment.Responses
{
    public class TaskCommentResponseDTO
    {
        public Guid TaskCommentId { get; set; }
        public Guid TaskId { get; set; }
        public Guid EmployeeId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
