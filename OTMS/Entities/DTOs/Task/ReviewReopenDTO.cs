namespace OTMS.Entities.DTOs.Task
{
    public class ReviewReopenDTO
    {
        public string ApprovalDecision { get; set; } = string.Empty; // "Approve", "Reject"
        public string AdminRemarks { get; set; } = string.Empty;
    }
}
