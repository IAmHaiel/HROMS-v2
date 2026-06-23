namespace OTMS.Entities.Models
{
    public class Employee
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;

        // Names
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = string.Empty;

        public string ContactNumber { get; set; } = string.Empty;
        public string EmploymentStatus { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Email
        public string Email { get; set; } = string.Empty;
        public bool IsEmailVerified { get; set; }
        public string? EmailVerificationToken { get; set; }
        public DateTime? EmailVerificationTokenExpiry { get; set; }

        // Navigation properties
        public Guid? DepartmentId { get; set; }
        public Department? Department { get; set; }

        public Guid? JobPositionId { get; set; }
        public JobPosition? JobPosition { get; set; }

        // Resignation / Offboarding
        public DateTime? ResignationDate { get; set; }
        public DateTime? OffboardingDate { get; set; }
        public DateTime? NTEDate { get; set; }
        public string? OffboardingRemarks { get; set; }

        public Account? Account { get; set; }
        public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
        public ICollection<EmployeeAttachment> Attachments { get; set; } = new List<EmployeeAttachment>();
    }
}
