using System;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.Models
{
    public class TaskReopenRequest
    {
        public Guid RequestId { get; set; }
        
        public Guid TaskId { get; set; }
        public Entities.Models.Task Task { get; set; } = null!;

        public Guid RequestedById { get; set; }
        public Account RequestedBy { get; set; } = null!;

        [MaxLength(8)]
        public string ReferenceNumber { get; set; } = string.Empty;

        public string Reason { get; set; } = string.Empty;
        public string? EvidenceUrl { get; set; }

        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        public string? AdminRemarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
