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
    }
}