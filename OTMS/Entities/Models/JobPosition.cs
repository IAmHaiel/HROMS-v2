namespace OTMS.Entities.Models
{
    public class JobPosition
    {
        public Guid JobPositionId { get; set; }
        public Guid DepartmentId { get; set; }
        
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public string Code { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;

        public Guid? ReportsToId { get; set; }
        public JobPosition? ReportsTo { get; set; }

        public string EmploymentType { get; set; } = string.Empty;
        public string PositionLevel { get; set; } = string.Empty;
        public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Department Department { get; set; } = null!;
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    }
}
