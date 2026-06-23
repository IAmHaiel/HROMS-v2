namespace OTMS.Entities.DTOs
{
    public class EmployeeAttachmentDTO
    {
        public Guid EmployeeAttachmentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int Version { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public bool IsArchived { get; set; }

        public string DocumentTitle { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Remarks { get; set; }

        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }
}
