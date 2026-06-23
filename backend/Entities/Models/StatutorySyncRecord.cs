using System;

namespace OTMS.Entities.Models
{
    public class StatutorySyncRecord
    {
        public Guid StatutorySyncRecordId { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
        public string TargetSystem { get; set; } = "FOMS";
        public string SyncStatus { get; set; } = "Pending";
        public DateTime SyncTimestamp { get; set; } = DateTime.UtcNow;
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}