using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Public
{
    public class ApplicantSubmissionDTO
    {
        [Required]
        public string GoogleToken { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "Contact number must be exactly 11 digits.")]
        public string ContactNumber { get; set; } = string.Empty;

        [Required]
        public Guid JobPositionId { get; set; }

        [Required]
        public IFormFile Resume { get; set; } = null!;
    }
}
