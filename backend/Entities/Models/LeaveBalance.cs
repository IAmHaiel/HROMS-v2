using System;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.Models
{
    public class LeaveBalance
    {
        [Key]
        public Guid LeaveBalanceId { get; set; }

        public Guid EmployeeId { get; set; }

        public string LeaveType { get; set; } = string.Empty;

        public decimal TotalDays { get; set; }

        public decimal UsedDays { get; set; }

        public decimal RemainingDays { get; set; }

        public DateTime UpdatedAt { get; set; }

        public Employee Employee { get; set; } = null!;
    }
}
