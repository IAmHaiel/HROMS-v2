using Microsoft.AspNetCore.Http;

namespace OTMS.Entities.DTOs.Task
{
    public class UpdateTaskProgressDTO
    {
        public string TaskStatus { get; set; } = string.Empty;
        public string? TaskRemarks { get; set; }
        
        public string? ProgressNotes { get; set; }
        public IFormFile? SupportingEvidence { get; set; }
    }
}
