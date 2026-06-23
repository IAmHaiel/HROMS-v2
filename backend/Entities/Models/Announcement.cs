namespace OTMS.Entities.Models
{
    public class Announcement
    {
        public Guid AnnouncementId { get; set; }
        public Guid CreatedBy { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string TargetRole { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Account Creator { get; set; } = null!;
    }
}
