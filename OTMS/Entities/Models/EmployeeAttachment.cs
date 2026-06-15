namespace OTMS.Entities.Models
{
    public class EmployeeAttachment
    {
        public Guid EmployeeAttachmentId { get; set; }
        public Guid EmployeeId { get; set; }

        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty; // URL or local path
        public string ContentType { get; set; } = string.Empty; // e.g., application/pdf, image/jpeg
        public long FileSize { get; set; } // Size in bytes
        public int Version { get; set; } = 1; // File version

        public string DocumentType { get; set; } = string.Empty; // e.g., Resume, Contract, Government, Certificate, Performance, Disciplinary
        public bool IsArchived { get; set; } = false;

        public DateTime UploadedAt { get; set; }

        // Navigation property
        public Employee Employee { get; set; } = null!;
    }
}
