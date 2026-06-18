using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.Models
{
    public class Task
    {
        public Guid TaskId { get; set; }

        public Guid CreatedBy { get; set; }
        public Guid? AssignedTo { get; set; }
        public Guid? EvaluatedBy { get; set; }

        [MaxLength(150)]
        public string TaskTitle { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? TaskDescription { get; set; }

        [MaxLength(100)]
        public string? TaskCategory { get; set; }

        public string Priority { get; set; } = "Medium";
        public DateTime? DueAt { get; set; }
        public bool Deleted { get; set; } = false;
        public bool PermanentlyDeleted { get; set; } = false;

        [MaxLength(500)]
        public string? TaskRemarks { get; set; }
        public string TaskStatus { get; set; } = "Draft";

        public string? ProgressNotes { get; set; }
        public string? ProgressEvidenceUrl { get; set; }

        public string? SupportingEvidenceUrl { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Account Creator { get; set; } = null!;
        public Account? Assignee { get; set; }
        public Account? Evaluator { get; set; }

        public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
        public ICollection<TaskReopenRequest> ReopenRequests { get; set; } = new List<TaskReopenRequest>();
        public ICollection<TaskStatusRecord> StatusRecords { get; set; } = new List<TaskStatusRecord>();
        public ICollection<AdminOverrideRecord> OverrideRecords { get; set; } = new List<AdminOverrideRecord>();

        public Guid? TaskTemplateId { get; set; }
        public TaskTemplate? TaskTemplate { get; set; }
    }
}

