using System;

namespace OTMS.Entities.DTOs.Dashboard
{
    public class DashboardFilterDTO
    {
        public DateTime? DateRangeStart { get; set; }
        public DateTime? DateRangeEnd { get; set; }
        public Guid? EmployeeId { get; set; }
        public Guid? DepartmentId { get; set; }
        public string? TaskStatus { get; set; }
    }
}
