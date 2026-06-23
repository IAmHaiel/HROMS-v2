using Microsoft.AspNetCore.Http;

namespace OTMS.Entities.DTOs.Task
{
    public class RequestReopenDTO
    {
        public string Reason { get; set; } = string.Empty;
        public IFormFile? SupportingEvidence { get; set; }
    }
}
