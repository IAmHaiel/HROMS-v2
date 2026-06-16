using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OTMS.Entities.Models
{
    public class NotificationAuditLog
    {
        [Key]
        public Guid AuditId { get; set; }

        [Required]
        public Guid ApprovalRequestId { get; set; }

        [Required]
        public Guid RecipientAccountId { get; set; }

        [Required]
        [MaxLength(50)]
        public string NotificationType { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Channel { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ErrorMessage { get; set; }

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ApprovalRequestId")]
        public ApprovalRequest ApprovalRequest { get; set; } = null!;

        [ForeignKey("RecipientAccountId")]
        public Account Recipient { get; set; } = null!;
    }
}
