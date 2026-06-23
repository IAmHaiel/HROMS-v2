using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Approval
{
    public class CreateRoutingMatrixDTO
    {
        [Required]
        public string RequestType { get; set; } = string.Empty;
        public List<CreateTierDTO> Tiers { get; set; } = new();
    }

    public class CreateTierDTO
    {
        public int TierLevel { get; set; }
        [Required]
        public string ApproverRole { get; set; } = string.Empty;
        public string? FallbackApproverRole { get; set; }
        public bool IsFinalTier { get; set; }
    }
}
