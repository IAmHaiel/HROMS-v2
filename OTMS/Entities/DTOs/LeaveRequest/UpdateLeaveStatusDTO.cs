namespace OTMS.Entities.DTOs.LeaveRequest
{
    public class UpdateLeaveStatusDTO
    {
        public string LeaveRequestNote { get; set; } = string.Empty;
        public string Approval_Status { get; set; } = string.Empty;
    }
}
