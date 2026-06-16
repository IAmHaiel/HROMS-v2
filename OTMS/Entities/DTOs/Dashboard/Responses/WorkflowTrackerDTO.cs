using OTMS.Entities.DTOs.Approval.Responses;

namespace OTMS.Entities.DTOs.Dashboard.Responses
{
    public class WorkflowTrackerDTO
    {
        public Guid ApprovalRequestId { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string SourceEntityType { get; set; } = string.Empty;
        public Guid SourceEntityId { get; set; }
        public string StatusTrackingText { get; set; } = string.Empty;
        public int CurrentTierLevel { get; set; }
        public int TotalTierCount { get; set; }
        public string? CurrentTierLabel { get; set; }
        public string? CurrentApproverName { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<ApprovalDecisionResponseDTO> Decisions { get; set; } = new();
    }
}
