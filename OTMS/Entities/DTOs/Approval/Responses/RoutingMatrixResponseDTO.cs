using System;
using System.Collections.Generic;

namespace OTMS.Entities.DTOs.Approval.Responses
{
    public class RoutingMatrixResponseDTO
    {
        public Guid RoutingMatrixId { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public List<TierResponseDTO> Tiers { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class TierResponseDTO
    {
        public Guid TierId { get; set; }
        public int TierLevel { get; set; }
        public string ApproverRole { get; set; } = string.Empty;
        public string? FallbackApproverRole { get; set; }
        public bool IsFinalTier { get; set; }
    }
}
