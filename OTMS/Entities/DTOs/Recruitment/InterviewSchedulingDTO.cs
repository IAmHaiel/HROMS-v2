using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Recruitment
{
    public class InterviewSchedulingDTO
    {
        [Required]
        public Guid ApplicantRecordId { get; set; }

        [Required]
        public DateTime InterviewDate { get; set; }

        [Required]
        public string InterviewTime { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string LocationOrLink { get; set; } = string.Empty;

        [Required]
        public string InterviewerName { get; set; } = string.Empty;
    }
}