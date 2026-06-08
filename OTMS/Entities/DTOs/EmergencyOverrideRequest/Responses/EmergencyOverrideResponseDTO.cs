namespace OTMS.Entities.DTOs.EmergencyOverrideRequest.Responses
{
    public class EmergencyOverrideResponseDTO
    {
        public Guid EmergencyOverrideId { get; set; }
        public Guid RequestedById { get; set; }
        public Guid LeaveId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? OverrideUntil { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeNumber { get; set; } = string.Empty;
    }
}
