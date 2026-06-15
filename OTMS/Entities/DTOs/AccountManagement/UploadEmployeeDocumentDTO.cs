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
    }
}
