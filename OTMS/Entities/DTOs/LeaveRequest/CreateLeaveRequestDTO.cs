namespace OTMS.Entities.DTOs.LeaveRequest
{
    public class CreateLeaveRequestDTO
    {
        public DateTime Start_Date { get; set; }
        public DateTime End_Date { get; set; }
        public string Leave_Type { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }
}
