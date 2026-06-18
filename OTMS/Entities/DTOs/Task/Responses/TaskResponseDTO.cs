namespace OTMS.Entities.DTOs.Task.Responses
{
    public class TaskResponseDTO
    {
        public Guid TaskId { get; set; }
        public string TaskTitle { get; set; } = string.Empty;
        public string? TaskDescription { get; set; }
        public string? TaskCategory { get; set; }
        public string TaskReferenceNumber { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime? DueAt { get; set; }
        public string TaskStatus { get; set; } = string.Empty;
        public string AssignedEmployee { get; set; } = string.Empty;
        public string CreatedByEmployee { get; set; } = string.Empty;
        public Guid? AssignedTo { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public string? TaskRemarks { get; set; }
        public string? SupportingEvidenceUrl { get; set; }
    }
}
