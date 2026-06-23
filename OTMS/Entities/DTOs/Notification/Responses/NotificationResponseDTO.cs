namespace OTMS.Entities.DTOs.Notification.Responses
{
    public class NotificationResponseDTO
    {
        public Guid NotificationId { get; set; }
        public Guid? TaskId { get; set; }
        public string NotificationType { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
