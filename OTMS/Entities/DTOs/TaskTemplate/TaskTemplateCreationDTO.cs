using System;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.TaskTemplate
{
    public class TaskTemplateCreationDTO
    {
        [Required]
        [MaxLength(150)]
        public string TemplateName { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string TemplateDescription { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Low|Medium|High|Critical)$", ErrorMessage = "Priority Level must be Low, Medium, High, or Critical")]
        public string PriorityLevel { get; set; } = "Medium";

        [Required]
        [RegularExpression("^(Daily|Weekly|Monthly)$", ErrorMessage = "Recurrence Type must be Daily, Weekly, or Monthly")]
        public string RecurrenceType { get; set; } = "Daily";

        [Required]
        public DateTime RecurrenceStartDate { get; set; }

        public Guid? AssignedEmployee { get; set; }

        [Required]
        [RegularExpression("^(Active|Inactive)$", ErrorMessage = "Template Status must be Active or Inactive")]
        public string TemplateStatus { get; set; } = "Active";
    }
}
