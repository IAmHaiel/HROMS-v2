using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Public
{
    public class ApplicantSubmissionDTO
    {
        [Required]
        public string GoogleToken { get; set; } = string.Empty;

        // ─── Personal Information ───────────────────────────────────────────
        [Required]
        [MaxLength(128)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(128)]
        public string? MiddleName { get; set; }

        [Required]
        [MaxLength(128)]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Suffix { get; set; }

        [Required]
        public string Gender { get; set; } = string.Empty;

        [Required]
        public string CivilStatus { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "Contact number must be exactly 11 digits.")]
        public string ContactNumber { get; set; } = string.Empty;

        [Required]
        public string CurrentResidentialAddress { get; set; } = string.Empty;

        [Required]
        public string PermanentAddress { get; set; } = string.Empty;

        // ─── Statutory and Government Identifiers ──────────────────────────
        [Required]
        public string SSSNumber { get; set; } = string.Empty;
        [Required]
        public string PhilHealthNumber { get; set; } = string.Empty;
        [Required]
        public string PagIBIGNumber { get; set; } = string.Empty;
        [Required]
        public string TIN { get; set; } = string.Empty;

        // ─── Financial and Payroll Data ────────────────────────────────────
        public string? BankName { get; set; }
        public string? BankAccountName { get; set; }
        public string? BankAccountNumber { get; set; }

        // ─── Pre-Employment Documents ──────────────────────────────────────
        public IFormFile? NBIClearance { get; set; }
        public IFormFile? MedicalClearance { get; set; }
        public IFormFile? PSABirthCertificate { get; set; }

        [Required]
        public IFormFile Resume { get; set; } = null!;

        public IFormFile? SignedEmploymentContract { get; set; }

        // ─── Emergency and Dependent Information ──────────────────────────
        [Required]
        public string EmergencyContactName { get; set; } = string.Empty;

        [Required]
        public string EmergencyContactRelationship { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "Emergency contact number must be exactly 11 digits.")]
        public string EmergencyContactMobileNumber { get; set; } = string.Empty;

        public string? DeclaredDependents { get; set; }

        // ─── Educational and Professional Background ──────────────────────
        [Required]
        public string HighestEducationalAttainment { get; set; } = string.Empty;

        [Required]
        public string Institution { get; set; } = string.Empty;

        [Required]
        public string YearGraduated { get; set; } = string.Empty;

        public string? ProfessionalLicensesCertifications { get; set; }

        // ─── Position ─────────────────────────────────────────────────────
        [Required]
        public Guid JobPositionId { get; set; }
    }
}
