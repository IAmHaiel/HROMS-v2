using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.AccountManagement
{
    public class UploadEmployeeDocumentDTO
    {
        [Required]
        public IFormFile File { get; set; } = null!;

        [Required]
        public string DocumentType { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string DocumentTitle { get; set; } = string.Empty;

        [Required]
        public DateTime IssueDate { get; set; }

        public DateTime? ExpiryDate { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }
    }
}
