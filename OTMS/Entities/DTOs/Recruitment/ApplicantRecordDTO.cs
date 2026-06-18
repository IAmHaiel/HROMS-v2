namespace OTMS.Entities.DTOs.Recruitment
{
    public class ApplicantRecordDTO
    {
        public Guid ApplicantRecordId { get; set; }
        public string ReferenceNumber { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;

        // Personal Information
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; }
        public string? Gender { get; set; }
        public string? CivilStatus { get; set; }
        public string EmailAddress { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string? CurrentResidentialAddress { get; set; }
        public string? PermanentAddress { get; set; }

        // Statutory & Government IDs
        public string? SSSNumber { get; set; }
        public string? PhilHealthNumber { get; set; }
        public string? PagIBIGNumber { get; set; }
        public string? TIN { get; set; }

        // Financial
        public string? BankName { get; set; }
        public string? BankAccountName { get; set; }
        public string? BankAccountNumber { get; set; }

        // Document paths
        public string? NBIClearanceFilePath { get; set; }
        public string? MedicalClearanceFilePath { get; set; }
        public string? PSABirthCertificateFilePath { get; set; }
        public string ResumeFilePath { get; set; } = string.Empty;
        public string? SignedEmploymentContractFilePath { get; set; }

        // Emergency & Dependents
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactRelationship { get; set; }
        public string? EmergencyContactMobileNumber { get; set; }
        public string? DeclaredDependents { get; set; }

        // Education
        public string? HighestEducationalAttainment { get; set; }
        public string? Institution { get; set; }
        public string? YearGraduated { get; set; }
        public string? ProfessionalLicensesCertifications { get; set; }

        // Verification
        public bool IsEmailVerified { get; set; }

        // Job & Status
        public string JobPositionName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
