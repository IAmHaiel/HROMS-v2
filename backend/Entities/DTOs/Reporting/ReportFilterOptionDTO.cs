using System;
using System.Collections.Generic;

namespace OTMS.Entities.DTOs.Reporting
{
    public class ReportFilterOptionDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ReportFilterOptionsDTO
    {
        public List<ReportFilterOptionDTO> Departments { get; set; } = new();
        public List<ReportFilterOptionDTO> Employees { get; set; } = new();
    }
}
