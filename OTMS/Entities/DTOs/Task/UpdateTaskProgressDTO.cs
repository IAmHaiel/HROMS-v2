namespace OTMS.Entities.DTOs.Task
{
    public class UpdateTaskProgressDTO
    {
        public string TaskStatus { get; set; } = string.Empty;
        public string? TaskRemarks { get; set; }
    }
}
