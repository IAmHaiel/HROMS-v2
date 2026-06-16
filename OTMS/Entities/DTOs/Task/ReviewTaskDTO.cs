using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Task
{
    public class ReviewTaskDTO
    {
        [Required]
        [RegularExpression("^(Approve & Close|Return for Rework)$", ErrorMessage = "Admin Decision must be 'Approve & Close' or 'Return for Rework'")]
        public string AdminDecision { get; set; } = string.Empty;

        public string? ReviewerRemarks { get; set; }
    }
}
