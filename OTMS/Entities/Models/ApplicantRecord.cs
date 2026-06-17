using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.Models
{
    public class ApplicantRecord
    {
        public Guid ApplicantRecordId { get; set; }

        // Personal Information
        [MaxLength(128)]
        public string FirstName { get; set; } = string.Empty;
        [MaxLength(128)]
        public string? MiddleName { get; set; }
        [MaxLength(128)]
        public string LastName { get; set; } = string.Empty;
        [MaxLength(20)]
        public string? Suffix { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string? Gender { get; set; }
        public string? CivilStatus { get; set; }
        public string EmailAddress { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string? CurrentResidentialAddress { get; set; }
        public string? PermanentAddress { get; set; }

        // Statutory and Government Identifiers
        public string? SSSNumber { get; set; }
        public string? PhilHealthNumber { get; set; }
        public string? PagIBIGNumber { get; set; }
        public string? TIN { get; set; }

        // Financial and Payroll Data
        public string? BankName { get; set; }
        public string? BankAccountName { get; set; }
        public string? BankAccountNumber { get; set; }

        // Pre-Employment Clearances and Documents (file paths)
        public string? NBIClearanceFilePath { get; set; }
        public string? MedicalClearanceFilePath { get; set; }
        public string? PSABirthCertificateFilePath { get; set; }
        public string ResumeFilePath { get; set; } = string.Empty;
        public string? SignedEmploymentContractFilePath { get; set; }

        // Emergency and Dependent Information
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactRelationship { get; set; }
        public string? EmergencyContactMobileNumber { get; set; }
        public string? DeclaredDependents { get; set; }

        // Educational and Professional Background
        public string? HighestEducationalAttainment { get; set; }
        public string? InstitutionAndYearGraduated { get; set; }
        public string? ProfessionalLicensesCertifications { get; set; }

        // Job
        public Guid JobPositionId { get; set; }
        public JobPosition JobPosition { get; set; } = null!;

        // Status
        public string Status { get; set; } = "Pending Review";

        // Email verification
        public bool IsEmailVerified { get; set; }
        public string? EmailVerificationToken { get; set; }
        public DateTime? EmailVerificationTokenExpiry { get; set; }

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<ApplicantStatusRecord> StatusHistory { get; set; } = new List<ApplicantStatusRecord>();
    }
}
