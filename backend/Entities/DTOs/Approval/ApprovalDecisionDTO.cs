using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Approval
{
    public class ApprovalDecisionDTO
    {
        [Required(ErrorMessage = "Decision is required.")]
        public string Decision { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Remarks must not exceed 500 characters.")]
        public string? Remarks { get; set; }
    }
}
