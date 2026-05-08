namespace OTMS.Entities.Models
{
    public class TaskComment
    {
        public Guid TaskCommentId { get; set; }
        public Guid EmployeeId { get; set; }
        public Guid TaskId { get; set; }

        public string Message { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Employee Employee { get; set; } = null!;
        public Task Task { get; set; } = null!;
    }
}
