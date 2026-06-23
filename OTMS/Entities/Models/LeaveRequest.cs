using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.Models
{
    public class LeaveRequest
    {
        [Key]
        public Guid LeaveId { get; set; }
        public Guid AccountId { get; set; } // Employee who submitted the leave request
        public Guid? Approved_By { get; set; } // Employee who approved the leave request

        public bool Deleted { get; set; } = false;
        public string Leave_Type { get; set; } = string.Empty;
        public string LeaveRequestNote { get; set; } = string.Empty;
        public DateTime Start_Date { get; set; }
        public DateTime End_Date { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Approval_Status { get; set; } = "Pending";
        public DateTime SubmittedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public Account Account { get; set; } // Submitter
        public Account? ApprovedByAccount { get; set; } // Approver
    }
}
