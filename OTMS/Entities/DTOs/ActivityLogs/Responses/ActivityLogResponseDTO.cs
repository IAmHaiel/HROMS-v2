namespace OTMS.Entities.DTOs.ActivityLogs.Responses
{
    public class ActivityLogResponseDTO
    {
        public Guid ActivityLogId { get; set; }
        public Guid AccountId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = null;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = null;
        public string ActivityType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } 
    }
}
