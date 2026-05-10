namespace OTMS.Entities.Models
{
    public class Account
    {
        public Guid AccountId { get; set; }
        public Guid EmployeeId { get; set; }

        public string Role { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string AccountStatus { get; set; } = "Active";
        public int FailedLoginAttempts { get; set; }

        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Employee Employee { get; set; } = null!;
        public ICollection<Task> AssignedTasks { get; set; } = new List<Task>();
        public ICollection<Task> CreatedTasks { get; set; } = new List<Task>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
       
        // for password change tracking.
        public bool IsPasswordChanged { get; set; } = false;
    }
}
