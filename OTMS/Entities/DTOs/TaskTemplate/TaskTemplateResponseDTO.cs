using System;

namespace OTMS.Entities.DTOs.TaskTemplate
{
    public class TaskTemplateResponseDTO
    {
        public Guid TemplateId { get; set; }
        public string TemplateName { get; set; } = string.Empty;
        public string TemplateDescription { get; set; } = string.Empty;
        public string PriorityLevel { get; set; } = string.Empty;
        public string RecurrenceType { get; set; } = string.Empty;
        public DateTime RecurrenceStartDate { get; set; }
        public Guid? AssignedEmployeeId { get; set; }
        public string? AssignedEmployeeName { get; set; }
        public string TemplateStatus { get; set; } = string.Empty;
        public DateTime? NextGenerationDate { get; set; }
        public DateTime? LastGeneratedDate { get; set; }
        public Guid CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
