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

        public DateTime UploadedAt { get; set; }

        // Navigation property
        public Employee Employee { get; set; } = null!;
    }
}
