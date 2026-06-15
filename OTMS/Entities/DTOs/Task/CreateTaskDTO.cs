using System;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Task
{
    public class CreateTaskDTO
    {
        public Guid? AssignedTo { get; set; }

        [Required(ErrorMessage = "Task Title is required.")]
        public string TaskTitle { get; set; } = string.Empty;

        public string? TaskDescription { get; set; }

        public string? TaskCategory { get; set; }

        public string Priority { get; set; } = "Normal";

        public DateTime? DueAt { get; set; }

        public Guid? RecommendedEmployeeId { get; set; }
    }
}
