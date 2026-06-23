using System;

namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class EmploymentContractResponseDTO
    {
        public Guid EmployeeAttachmentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int Version { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public bool IsArchived { get; set; }
        public DateTime UploadedAt { get; set; }
        public string ContractStatus { get; set; } = string.Empty;

        public string DocumentTitle { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Remarks { get; set; }

        public string EmployeeNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? DepartmentName { get; set; }
        public string? JobPositionTitle { get; set; }
    }
}
