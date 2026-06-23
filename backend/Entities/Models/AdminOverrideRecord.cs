using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OTMS.Entities.Models
{
    public class AdminOverrideRecord
    {
        [Key]
        public Guid OverrideId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TaskId { get; set; }

        [Required]
        public Guid AdminId { get; set; }

        [Required]
        [MaxLength(500)]
        public string OverrideReason { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string AdminRemarks { get; set; } = string.Empty;

        public bool ApprovalConfirmation { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("TaskId")]
        public Task Task { get; set; } = null!;

        [ForeignKey("AdminId")]
        public Account Admin { get; set; } = null!;
    }
}
