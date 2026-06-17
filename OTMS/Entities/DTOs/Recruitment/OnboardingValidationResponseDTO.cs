namespace OTMS.Entities.DTOs.Recruitment
{
    public class OnboardingValidationResponseDTO
    {
        public string AccessToken { get; set; } = string.Empty;
        public string EmployeeNumber { get; set; } = string.Empty;
        public Guid EmployeeId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; }
        public string ContactNumber { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public string JobPositionName { get; set; } = string.Empty;
        public string? ResumeFilePath { get; set; }
        public string? MedicalClearanceFilePath { get; set; }
        public string? SSSNumber { get; set; }
        public string? PhilHealthNumber { get; set; }
        public string? PagIBIGNumber { get; set; }
        public string? TIN { get; set; }
        public string? BankName { get; set; }
        public string? BankAccountName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactRelationship { get; set; }
        public string? EmergencyContactMobileNumber { get; set; }
    }
}