using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Recruitment
{
    public class CompleteOnboardingDTO
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        public string? EducationLevel { get; set; }
        public string? EducationInstitution { get; set; }
        public string? EducationDegree { get; set; }
        public int? EducationYearGraduated { get; set; }
        public bool EducationIsCurrentlyEnrolled { get; set; }
    }
}
