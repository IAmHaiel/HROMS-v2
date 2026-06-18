using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Recruitment
{
    public class ValidateOnboardingTokenDTO
    {
        [Required]
        public string Token { get; set; } = string.Empty;
        public string? Password { get; set; }

        // 201 File data
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
        public string? MotherFirstName { get; set; }
        public string? MotherMiddleName { get; set; }
        public string? MotherLastName { get; set; }
        public string? FatherFirstName { get; set; }
        public string? FatherMiddleName { get; set; }
        public string? FatherLastName { get; set; }
    }
}
