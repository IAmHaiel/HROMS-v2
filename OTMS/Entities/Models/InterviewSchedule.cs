namespace OTMS.Entities.Models
{
    public class InterviewSchedule
    {
        public Guid InterviewScheduleId { get; set; }
        public Guid ApplicantRecordId { get; set; }
        public ApplicantRecord ApplicantRecord { get; set; } = null!;
        public DateTime InterviewDate { get; set; }
        public string InterviewTime { get; set; } = string.Empty;
        public string LocationOrLink { get; set; } = string.Empty;
        public string InterviewerName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}