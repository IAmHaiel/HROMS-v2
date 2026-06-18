namespace OTMS.Entities.DTOs.Recruitment
{
    public class OnboardingValidationResponseDTO
    {
        public string AccessToken { get; set; } = string.Empty;
        public string EmployeeNumber { get; set; } = string.Empty;
        public Guid EmployeeId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public string JobPositionName { get; set; } = string.Empty;

        public string? EducationLevel { get; set; }
        public string? EducationInstitution { get; set; }
        public string? EducationDegree { get; set; }
        public int? EducationYearGraduated { get; set; }
        public bool EducationIsCurrentlyEnrolled { get; set; }
    }
}