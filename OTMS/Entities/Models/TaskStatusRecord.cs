using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OTMS.Entities.Models
{
    public class TaskStatusRecord
    {
        [Key]
        public Guid RecordId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TaskId { get; set; }

        public string CurrentStatus { get; set; } = string.Empty;
        
        [Required]
        public string RequestedStatus { get; set; } = string.Empty;

        public DateTime ChangeDate { get; set; } = DateTime.UtcNow;

        [Required]
        public Guid UpdatedBy { get; set; }

        public bool IsSuccessful { get; set; }
        
        public string? FailureReason { get; set; }

        // Navigation properties
        [ForeignKey("TaskId")]
        public Task Task { get; set; } = null!;

        [ForeignKey("UpdatedBy")]
        public Account Updater { get; set; } = null!;
    }
}
