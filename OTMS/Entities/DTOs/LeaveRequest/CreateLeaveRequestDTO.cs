namespace OTMS.Entities.DTOs.LeaveRequest
{
    public class CreateLeaveRequestDTO
    {
        public Guid AccountId { get; set; }
        public DateTime Start_Date { get; set; }
        public DateTime End_Date { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
