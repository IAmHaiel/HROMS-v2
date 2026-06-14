namespace OTMS.Entities.Models
{
    public class Account
    {
        public Guid AccountId { get; set; }
        public Guid EmployeeId { get; set; }

        public Guid RoleId { get; set; }
        public Role Role { get; set; } = null!;
        public string PasswordHash { get; set; } = string.Empty;
        public string AccountStatus { get; set; } = "Active";
        public int FailedLoginAttempts { get; set; }

        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiryTime { get; set; }

        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Employee Employee { get; set; } = null!;
        public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
        public ICollection<Task> AssignedTasks { get; set; } = new List<Task>();
        public ICollection<Task> CreatedTasks { get; set; } = new List<Task>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<LeaveRequest> SubmittedLeaveRequests { get; set; } = new List<LeaveRequest>(); // Leave Request that is submitted by this Account.
        public ICollection<LeaveRequest> ApprovedLeaveRequests { get; set; } = new List<LeaveRequest>(); // Leave Request that is approved by this Account.
        public ICollection<EmergencyOverrideRequest> RequestedEmergencyOverrides { get; set; } = new List<EmergencyOverrideRequest>(); // Emergency Override Requests that is requested by this Account.
        public ICollection<EmergencyOverrideRequest> ApprovedEmergencyOverrides { get; set; } = new List<EmergencyOverrideRequest>(); // Emergency Override Requests that is approved by this Account.


        // for password change tracking.
        public bool IsPasswordChanged { get; set; } = false;
    }
}
