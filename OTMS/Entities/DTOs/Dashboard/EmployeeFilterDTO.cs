using System;

namespace OTMS.Entities.DTOs.Dashboard
{
    public class EmployeeFilterDTO
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
    }
}
