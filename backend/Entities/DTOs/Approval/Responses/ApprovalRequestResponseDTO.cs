using OTMS.Entities.Models;

namespace OTMS.Entities.DTOs.Approval.Responses
{
    public class ApprovalRequestResponseDTO
    {
        public Guid ApprovalRequestId { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string SourceEntityType { get; set; } = string.Empty;
        public Guid SourceEntityId { get; set; }
        public string RequesterName { get; set; } = string.Empty;
        public string? RequesterEmployeeNumber { get; set; }
        public int CurrentTierLevel { get; set; }
        public int TotalTierCount { get; set; }
        public string? CurrentTierLabel { get; set; }
        public string? StatusTrackingText { get; set; }
        public string? CurrentApproverName { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<ApprovalDecisionResponseDTO> Decisions { get; set; } = new();
    }

    public class ApprovalDecisionResponseDTO
    {
        public Guid ApprovalDecisionId { get; set; }
        public int TierLevel { get; set; }
        public string ApproverName { get; set; } = string.Empty;
        public string Decision { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PendingApprovalResponseDTO
    {
        public Guid ApprovalRequestId { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string RequesterName { get; set; } = string.Empty;
        public string RequesterEmployeeNumber { get; set; } = string.Empty;
        public int CurrentTierLevel { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
