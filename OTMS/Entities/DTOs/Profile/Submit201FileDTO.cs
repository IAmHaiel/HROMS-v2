using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Profile
{
    public class Submit201FileDTO
    {
        [Required]
        public string SssNumber { get; set; } = string.Empty;

        [Required]
        public string PhilhealthNumber { get; set; } = string.Empty;

        [Required]
        public string PagibigNumber { get; set; } = string.Empty;

        public string? TinNumber { get; set; }

        [Required]
        public string BankName { get; set; } = string.Empty;

        [Required]
        public string BankAccountNumber { get; set; } = string.Empty;

        [Required]
        public string EmergencyContactName { get; set; } = string.Empty;

        [Required]
        public string EmergencyContactNumber { get; set; } = string.Empty;
    }
}