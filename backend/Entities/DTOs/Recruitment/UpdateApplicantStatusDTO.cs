using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Recruitment
{
    public class UpdateApplicantStatusDTO
    {
        [Required]
        public Guid ApplicantRecordId { get; set; }

        [Required]
        public string NewStatus { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Remarks { get; set; }
    }
}
