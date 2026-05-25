namespace OTMS.Entities.DTOs.LeaveRequest.Responses
{
    public class LeaveRequestResponseDTO
    {
        public Guid LeaveId { get; set; }
        public Guid AccountId { get; set; }
        public DateTime Start_Date { get; set; }
        public DateTime End_Date { get; set; }
        public string Leave_Type { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Approval_Status { get; set; } = string.Empty;
    }
}
