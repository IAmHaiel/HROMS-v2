using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.Models
{
    public class EmergencyOverrideRequest
    {
        [Key]
        public Guid EmergencyOverrideId { get; set; }

        public Guid RequestedById { get; set; }
        public Guid LeaveId { get; set; }
        public Guid? ApprovedById { get; set; }

        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public bool Deleted { get; set; } = false;
        public string Reason { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? OverrideUntil { get; set; }

        // Navigation properties
        public Account RequestedBy { get; set; } = null!;
        public Account? ApprovedBy { get; set; }

        public LeaveRequest LeaveRequest { get; set; } = null!;

    }
}
