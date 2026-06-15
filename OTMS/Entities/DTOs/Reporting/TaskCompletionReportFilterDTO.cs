using System;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Reporting
{
    public class TaskCompletionReportFilterDTO
    {
        [Required(ErrorMessage = "Date Range Start is required.")]
        public DateTime DateRangeStart { get; set; }

        [Required(ErrorMessage = "Date Range End is required.")]
        public DateTime DateRangeEnd { get; set; }

        public Guid? EmployeeId { get; set; }
        public string? TaskPriorityLevel { get; set; }
        public string? TaskStatus { get; set; }
        public string? TaskCategory { get; set; }
    }
}
