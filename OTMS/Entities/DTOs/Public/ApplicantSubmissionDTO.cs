using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Public
{
    public class ApplicantSubmissionDTO
    {
        [Required]
        public string GoogleToken { get; set; } = string.Empty;

        // ─── Personal Information ───────────────────────────────────────────
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? MiddleName { get; set; }

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Suffix { get; set; }

        [Required]
        [MaxLength(50)]
        public string Gender { get; set; } = string.Empty;

        [Required]
        public string CivilStatus { get; set; } = string.Empty;

        public int? BirthMonth { get; set; }
        public int? BirthDay { get; set; }
        public int? BirthYear { get; set; }
        public int? Age { get; set; }

        [MaxLength(50)]
        public string? Nationality { get; set; }

        [MaxLength(50)]
        public string? Citizenship { get; set; }

        [Required]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "Contact number must be exactly 11 digits.")]
        public string ContactNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(256)]
        public string CurrentResidentialAddress { get; set; } = string.Empty;

        [Required]
        [MaxLength(256)]
        public string PermanentAddress { get; set; } = string.Empty;

        // ─── Documents ─────────────────────────────────────────────────────
        [Required]
        public IFormFile Resume { get; set; } = null!;

        // ─── Educational Background ──────────────────────────────────────
        [Required]
        [MaxLength(128)]
        public string HighestEducationalAttainment { get; set; } = string.Empty;

        [Required]
        [MaxLength(128)]
        public string Institution { get; set; } = string.Empty;

        [Required]
        public string YearGraduated { get; set; } = string.Empty;

        // ─── Professional Licenses ───────────────────────────────────────
        public List<IFormFile>? ProfessionalLicenseFiles { get; set; }

        // ─── Position ─────────────────────────────────────────────────────
        [Required]
        public Guid JobPositionId { get; set; }
    }
}
