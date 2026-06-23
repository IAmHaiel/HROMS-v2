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
        public string? Gender { get; set; }
        public string? CivilStatus { get; set; }
        public int? BirthMonth { get; set; }
        public int? BirthDay { get; set; }
        public int? BirthYear { get; set; }
        public int? Age { get; set; }
        public string ContactNumber { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public string JobPositionName { get; set; } = string.Empty;
        public string? ResumeFilePath { get; set; }
    }
}