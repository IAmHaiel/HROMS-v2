using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.AccountManagement
{
    public class UpdateStatutoryRecordsDTO
    {
        [Required]
        public string EmployeeNumber { get; set; } = string.Empty;

        [Required]
        public string SssNumber { get; set; } = string.Empty;

        [Required]
        public string PhilhealthNumber { get; set; } = string.Empty;

        [Required]
        public string PagibigNumber { get; set; } = string.Empty;

        [Required]
        public string TinNumber { get; set; } = string.Empty;
    }
}