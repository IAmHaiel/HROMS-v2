namespace OTMS.Entities.DTOs.Task
{
    public class ReopenRequestListDTO
    {
        public Guid RequestId { get; set; }
        public Guid TaskId { get; set; }
        public string TaskTitle { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string? SupportingEvidence { get; set; }
        public string CurrentStatus { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? AdminRemarks { get; set; }
    }
}
