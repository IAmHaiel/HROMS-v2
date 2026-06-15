using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.AccountManagement
{
    public class UploadEmploymentContractDTO
    {
        [Required]
        public string ContractType { get; set; } = string.Empty;

        [Required]
        public DateTime EffectiveStartDate { get; set; }

        public DateTime? EffectiveEndDate { get; set; }

        [Required]
        public IFormFile File { get; set; } = null!;
    }
}
