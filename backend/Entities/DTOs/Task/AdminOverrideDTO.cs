using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Task
{
    public class AdminOverrideDTO
    {
        [Required(ErrorMessage = "Override reason is required.")]
        [MaxLength(500, ErrorMessage = "Override reason cannot exceed 500 characters.")]
        public string OverrideReason { get; set; } = string.Empty;

        [Required(ErrorMessage = "Admin remarks are required.")]
        [MaxLength(500, ErrorMessage = "Admin remarks cannot exceed 500 characters.")]
        public string AdminRemarks { get; set; } = string.Empty;

        [Required(ErrorMessage = "Approval confirmation is required.")]
        public bool ApprovalConfirmation { get; set; }

        [Required(ErrorMessage = "Requested status is required.")]
        public string RequestedStatus { get; set; } = string.Empty;
    }
}
