namespace OTMS.Entities.DTOs.EmergencyOverrideRequest
{
    public class CreateEmergencyOverrideRequestDTO
    {
        public Guid AccountId { get; set; }
        public Guid LeaveId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
