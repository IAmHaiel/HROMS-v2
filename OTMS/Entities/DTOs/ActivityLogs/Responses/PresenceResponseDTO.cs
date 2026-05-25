namespace OTMS.Entities.DTOs.ActivityLogs.Responses
{
    public class PresenceResponseDTO
    {
        public Guid accountId { get; set; }
        public string employeeName { get; set; } = string.Empty;
        public string presenceStatus { get; set; } = string.Empty; // Online or Offline
        public DateTime lastSeen { get; set; }
    }
}
