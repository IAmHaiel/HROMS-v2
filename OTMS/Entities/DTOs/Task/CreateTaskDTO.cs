using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace OTMS.Entities.DTOs.Task
{
    public class CreateTaskDTO
    {
        [Required(ErrorMessage = "Assigned employee is required.")]
        public Guid AssignedTo { get; set; }

        [Required(ErrorMessage = "Task title is required.")]
        [MaxLength(150, ErrorMessage = "Task title must not exceed 150 characters.")]
        public string TaskTitle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Task description is required.")]
        [MaxLength(2000, ErrorMessage = "Task description must not exceed 2,000 characters.")]
        public string TaskDescription { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? TaskCategory { get; set; }

        [Required(ErrorMessage = "Priority is required.")]
        public string Priority { get; set; } = "Medium";

        [Required(ErrorMessage = "Deadline is required.")]
        public DateTime DueAt { get; set; }

        public IFormFile? SupportingEvidence { get; set; }

        public Guid? RecommendedEmployeeId { get; set; }

        public bool IsDuplicateAcknowledged { get; set; } = false;
    }
}
