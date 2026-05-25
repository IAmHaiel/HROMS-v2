namespace OTMS.Entities.DTOs.EmergencyOverrideRequest
{
    public class ApproveEmergencyOverrideDTO
    {
        public Guid EmergencyOverrideId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime OverrideUntil { get; set; }
    }
}
