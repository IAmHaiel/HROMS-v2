namespace OTMS.Entities.Models
{
    public class Employee
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Account? Account { get; set; }
        public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
    }
}
