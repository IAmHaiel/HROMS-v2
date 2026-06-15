using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.Models
{
    public class TaskTemplate
    {
        [Key]
        public Guid TemplateId { get; set; }

        [Required]
        [MaxLength(150)]
        public string TemplateName { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string TemplateDescription { get; set; } = string.Empty;

        [Required]
        public string PriorityLevel { get; set; } = "Medium";

        [Required]
        public string RecurrenceType { get; set; } = "Daily"; // Daily, Weekly, Monthly

        [Required]
        public DateTime RecurrenceStartDate { get; set; }

        public Guid? AssignedEmployee { get; set; }

        [Required]
        public string TemplateStatus { get; set; } = "Active"; // Active, Inactive

        public DateTime? NextGenerationDate { get; set; }

        public DateTime? LastGeneratedDate { get; set; }

        // Tracking
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public Account Creator { get; set; } = null!;
        public Account? Assignee { get; set; }

        public ICollection<Task> GeneratedTasks { get; set; } = new List<Task>();
    }
}
