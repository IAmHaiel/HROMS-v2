using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.Models
{
    public class ApprovalRoutingMatrix
    {
        [Key]
        public Guid RoutingMatrixId { get; set; }

        [Required]
        [MaxLength(100)]
        public string RequestType { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<ApprovalTier> Tiers { get; set; } = new List<ApprovalTier>();
    }
}
