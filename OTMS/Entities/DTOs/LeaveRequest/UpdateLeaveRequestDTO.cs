namespace OTMS.Entities.DTOs.LeaveRequest
{
    public class UpdateLeaveRequestDTO
    {
        public Guid LeaveId { get; set; }
        public string LeaveType { get; set; } = string.Empty;
        public string LeaveRequestNote { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
