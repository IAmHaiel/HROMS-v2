using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Recruitment
{
    public class ValidateOnboardingTokenDTO
    {
        [Required]
        public string Token { get; set; } = string.Empty;
    }
}