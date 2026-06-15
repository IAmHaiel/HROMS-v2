namespace OTMS.Entities.DTOs.Organization
{
    public class DepartmentResponseDTO
    {
        public Guid DepartmentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public string Code { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime EffectiveDate { get; set; }
        public Guid? HeadEmployeeId { get; set; }
        public string? HeadEmployeeName { get; set; }
        public int EmployeeCount { get; set; }
    }

    public class CreateDepartmentDTO
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public string Code { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;
        public Guid? HeadEmployeeId { get; set; }
    }

    public class JobPositionResponseDTO
    {
        public Guid JobPositionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;

        public string Code { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public Guid? ReportsToId { get; set; }
        public string? ReportsToName { get; set; }
        public string EmploymentType { get; set; } = string.Empty;
        public string PositionLevel { get; set; } = string.Empty;
        public DateTime EffectiveDate { get; set; }
    }

    public class CreateJobPositionDTO
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid DepartmentId { get; set; }

        public string Code { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public Guid? ReportsToId { get; set; }
        public string EmploymentType { get; set; } = string.Empty;
        public string PositionLevel { get; set; } = string.Empty;
        public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;
    }
}
