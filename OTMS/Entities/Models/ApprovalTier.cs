using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OTMS.Entities.Models
{
    public class ApprovalTier
    {
        [Key]
        public Guid TierId { get; set; }

        [Required]
        public Guid RoutingMatrixId { get; set; }

        public int TierLevel { get; set; }

        [Required]
        [MaxLength(100)]
        public string ApproverRole { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? FallbackApproverRole { get; set; }

        public bool IsFinalTier { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("RoutingMatrixId")]
        public ApprovalRoutingMatrix RoutingMatrix { get; set; } = null!;
    }
}
