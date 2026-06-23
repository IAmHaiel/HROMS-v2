using Microsoft.AspNetCore.Http;

namespace OTMS.Entities.DTOs.AccountManagement
{
    public class UpdateEmployeeDocumentDTO
    {
        public string? DocumentType { get; set; }
        public bool? IsArchived { get; set; }
        public IFormFile? File { get; set; }
    }
}
