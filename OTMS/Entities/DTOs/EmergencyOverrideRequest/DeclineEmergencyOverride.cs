namespace OTMS.Entities.DTOs.EmergencyOverrideRequest
{
    public class DeclineEmergencyOverrideDTO
    {
        public Guid ApproverAccountId { get; set; }
        public Guid EmergencyOverrideId { get; set; }
        public string? DeclineReason { get; set; }
    }
}