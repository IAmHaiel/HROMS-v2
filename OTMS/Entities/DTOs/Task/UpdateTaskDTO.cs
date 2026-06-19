using Microsoft.AspNetCore.Http;

namespace OTMS.Entities.DTOs.Task
{
    public class UpdateTaskDTO
    {
        public string TaskTitle { get; set; } = string.Empty;
        public string? TaskDescription { get; set; }
        public string? TaskCategory { get; set; }
        public string Priority { get; set; } = "Normal";
        public DateTime? DueAt { get; set; }
        public Guid? AssignedTo { get; set; }
        public string? TaskRemarks { get; set; }
        public IFormFile? SupportingEvidence { get; set; }
    }
}
