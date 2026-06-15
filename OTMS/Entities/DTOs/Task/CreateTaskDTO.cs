namespace OTMS.Entities.DTOs.Task
{
    public class CreateTaskDTO
    {
        public Guid AssignedTo { get; set; }
        public string TaskTitle { get; set; } = string.Empty;
        public string? TaskDescription { get; set; }
        public string Priority { get; set; } = "Normal";
        public DateTime? DueAt { get; set; }
        public Guid? RecommendedEmployeeId { get; set; }
    }
}
