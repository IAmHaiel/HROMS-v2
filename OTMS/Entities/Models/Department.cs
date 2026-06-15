namespace OTMS.Entities.Models
{
    public class Department
    {
        public Guid DepartmentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public string Code { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;

        public Guid? HeadEmployeeId { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.ForeignKey("HeadEmployeeId")]
        public Employee? HeadEmployee { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<JobPosition> JobPositions { get; set; } = new List<JobPosition>();
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    }
}
