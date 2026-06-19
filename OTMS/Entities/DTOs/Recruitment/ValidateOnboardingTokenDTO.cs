using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Recruitment
{
    public class ValidateOnboardingTokenDTO
    {
        [Required]
        public string Token { get; set; } = string.Empty;
        public string? Password { get; set; }

        // Profile fields
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? Suffix { get; set; }
        public string? ContactNumber { get; set; }
    }
}
