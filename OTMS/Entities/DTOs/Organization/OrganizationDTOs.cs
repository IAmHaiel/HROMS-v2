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

        // Accepts "Active" / "Inactive" string from frontend
        public string? Status { get; set; }

        // Also accept a direct bool (legacy / other callers)
        public bool? IsActive { get; set; }

        // Nullable so a missing / empty date doesn't crash model binding
        public DateTime? EffectiveDate { get; set; }

        public Guid? HeadEmployeeId { get; set; }

        // Resolved value used by the service
        public bool ResolvedIsActive =>
            IsActive ?? (Status?.Equals("Active", StringComparison.OrdinalIgnoreCase) ?? true);

        public DateTime ResolvedEffectiveDate =>
            EffectiveDate ?? DateTime.UtcNow;
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

        // Accepts "Active" / "Inactive" string from frontend
        public string? Status { get; set; }

        // Also accept a direct bool (legacy / other callers)
        public bool? IsActive { get; set; }

        public Guid? ReportsToId { get; set; }
        public string EmploymentType { get; set; } = string.Empty;
        public string PositionLevel { get; set; } = string.Empty;

        // Nullable so a missing / empty date doesn't crash model binding
        public DateTime? EffectiveDate { get; set; }

        // Resolved values used by the service
        public bool ResolvedIsActive =>
            IsActive ?? (Status?.Equals("Active", StringComparison.OrdinalIgnoreCase) ?? true);

        public DateTime ResolvedEffectiveDate =>
            EffectiveDate ?? DateTime.UtcNow;
    }
}
