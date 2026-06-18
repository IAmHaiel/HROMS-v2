using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.Models
{
    public class ApplicantRecord
    {
        public Guid ApplicantRecordId { get; set; }

        // Personal Information
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;
        [MaxLength(50)]
        public string? MiddleName { get; set; }
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;
        [MaxLength(50)]
        public string? Suffix { get; set; }

        public string FullName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Gender { get; set; }
        public string? CivilStatus { get; set; }
        public int? BirthMonth { get; set; }
        public int? BirthDay { get; set; }
        public int? BirthYear { get; set; }
        public int? Age { get; set; }
        public string? Nationality { get; set; }
        public string? Citizenship { get; set; }
        public string EmailAddress { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        [MaxLength(256)]
        public string? CurrentResidentialAddress { get; set; }
        [MaxLength(256)]
        public string? PermanentAddress { get; set; }

        public string ResumeFilePath { get; set; } = string.Empty;

        // Statutory and Government Identifiers
        public string? SSSNumber { get; set; }
        public string? PhilHealthNumber { get; set; }
        public string? PagIBIGNumber { get; set; }
        public string? TIN { get; set; }

        // Financial and Payroll Data
        [MaxLength(128)]
        public string? BankName { get; set; }
        [MaxLength(128)]
        public string? BankAccountName { get; set; }
        [MaxLength(34)]
        public string? BankAccountNumber { get; set; }

        // Pre-Employment Clearances and Documents (file paths)
        public string? NBIClearanceFilePath { get; set; }
        public string? MedicalClearanceFilePath { get; set; }
        public string? PSABirthCertificateFilePath { get; set; }
        public string? BIRForm2316FilePath { get; set; }

        // Emergency and Dependent Information
        [MaxLength(100)]
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactRelationship { get; set; }
        public string? EmergencyContactMobileNumber { get; set; }
        [MaxLength(100)]
        public string? DeclaredDependents { get; set; }

        // Family Background
        [MaxLength(50)]
        public string? MotherFirstName { get; set; }
        [MaxLength(50)]
        public string? MotherMiddleName { get; set; }
        [MaxLength(50)]
        public string? MotherLastName { get; set; }
        [MaxLength(50)]
        public string? FatherFirstName { get; set; }
        [MaxLength(50)]
        public string? FatherMiddleName { get; set; }
        [MaxLength(50)]
        public string? FatherLastName { get; set; }

        // Educational and Professional Background
        [MaxLength(128)]
        public string? HighestEducationalAttainment { get; set; }
        public string? InstitutionAndYearGraduated { get; set; }
        [MaxLength(128)]
        public string? Institution { get; set; }
        public string? YearGraduated { get; set; }
        [MaxLength(512)]
        public string? ProfessionalLicensesCertifications { get; set; }

        // Job
        public Guid JobPositionId { get; set; }
        public JobPosition JobPosition { get; set; } = null!;

        // Reference Number (public-facing unique identifier, not the PK)
        public string ReferenceNumber { get; set; } = string.Empty;

        // Status
        public string Status { get; set; } = "Pending Review";

        // Email verification
        public bool IsEmailVerified { get; set; }
        public string? EmailVerificationToken { get; set; }
        public DateTime? EmailVerificationTokenExpiry { get; set; }

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public ICollection<ApplicantStatusRecord> StatusHistory { get; set; } = new List<ApplicantStatusRecord>();
    }
}
