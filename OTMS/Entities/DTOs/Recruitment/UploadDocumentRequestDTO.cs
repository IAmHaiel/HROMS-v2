using Microsoft.AspNetCore.Http;

namespace OTMS.Entities.DTOs.Recruitment
{
    public class UploadDocumentRequestDTO
    {
        public string Token { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public IFormFile File { get; set; } = null!;
    }
}
