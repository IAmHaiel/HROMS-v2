namespace OTMS.Entities.DTOs.ActivityLogs.Responses
{
    public class ActivityLogResponseDTO
    {
        public Guid ActivityLogId { get; set; }
        public Guid AccountId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string ActivityType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } 
    }
}
