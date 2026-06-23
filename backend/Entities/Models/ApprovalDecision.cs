using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OTMS.Entities.Models
{
    public class ApprovalDecision
    {
        [Key]
        public Guid ApprovalDecisionId { get; set; }

        [Required]
        public Guid ApprovalRequestId { get; set; }

        public int TierLevel { get; set; }

        [Required]
        public Guid ApproverAccountId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Decision { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Remarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ApprovalRequestId")]
        public ApprovalRequest ApprovalRequest { get; set; } = null!;

        [ForeignKey("ApproverAccountId")]
        public Account Approver { get; set; } = null!;
    }
}
