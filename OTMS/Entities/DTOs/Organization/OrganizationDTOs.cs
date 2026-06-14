namespace OTMS.Entities.DTOs.Organization
{
    public class DepartmentResponseDTO
    {
        public Guid DepartmentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class CreateDepartmentDTO
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class JobPositionResponseDTO
    {
        public Guid JobPositionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
    }

    public class CreateJobPositionDTO
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid DepartmentId { get; set; }
    }
}
