namespace OTMS.Entities.DTOs.EmergencyOverrideRequest
{
    public class UpdateEmergencyOverrideDTO
    {
        public Guid EmergencyOverrideId { get; set; }
        public string Reason { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
