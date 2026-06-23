namespace OTMS.Entities.DTOs.ActivityLogs.Responses
{
    public class PresenceResponseDTO
    {
        public Guid accountId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = null;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = null;
        public string presenceStatus { get; set; } = string.Empty; // Online or Offline
        public DateTime? lastSeen { get; set; }
    }
}
