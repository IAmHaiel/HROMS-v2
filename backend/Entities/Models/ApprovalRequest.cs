using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OTMS.Entities.Models
{
    public class ApprovalRequest
    {
        [Key]
        public Guid ApprovalRequestId { get; set; }

        [Required]
        [MaxLength(100)]
        public string RequestType { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string SourceEntityType { get; set; } = string.Empty;

        [Required]
        public Guid SourceEntityId { get; set; }

        [Required]
        public Guid RequesterAccountId { get; set; }

        public int CurrentTierLevel { get; set; } = 0;

        public Guid? CurrentApproverAccountId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        [MaxLength(200)]
        public string? StatusTrackingText { get; set; }

        public int TotalTierCount { get; set; } = 0;

        public Guid? LastNotifiedAccountId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("RequesterAccountId")]
        public Account Requester { get; set; } = null!;

        [ForeignKey("CurrentApproverAccountId")]
        public Account? CurrentApprover { get; set; }

        public ICollection<ApprovalDecision> Decisions { get; set; } = new List<ApprovalDecision>();
    }
}
