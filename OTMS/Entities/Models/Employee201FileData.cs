using System;

namespace OTMS.Entities.Models
{
    public class Employee201FileData
    {
        public Guid Employee201FileDataId { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
        public string SssNumberEncrypted { get; set; } = string.Empty;
        public string PhilhealthNumberEncrypted { get; set; } = string.Empty;
        public string PagibigNumberEncrypted { get; set; } = string.Empty;
        public string? TinNumberEncrypted { get; set; }
        public string BankNameEncrypted { get; set; } = string.Empty;
        public string BankAccountNumberEncrypted { get; set; } = string.Empty;
        public string EmergencyContactNameEncrypted { get; set; } = string.Empty;
        public string EmergencyContactNumberEncrypted { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
