using System;

namespace OTMS.Entities.DTOs.Dashboard
{
    public class DepartmentFilterDTO
    {
        public Guid DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
    }
}
