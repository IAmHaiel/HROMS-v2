using System;

namespace OTMS.Entities.Models
{
    public class AssetAllocation
    {
        public Guid AssetAllocationId { get; set; }
        public Guid EmployeeId { get; set; }
        public string AssetType { get; set; } = string.Empty;
        public string AssetDescription { get; set; } = string.Empty;
        public string Status { get; set; } = "Allocated";
        public DateTime AllocatedAt { get; set; }
        public DateTime? ReturnedAt { get; set; }
        public Guid? ApprovedByRequestId { get; set; }
        public Employee Employee { get; set; } = null!;
    }
}
