namespace OTMS.Entities.Models
{
    public class ApplicantRecord
    {
        public Guid ApplicantRecordId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public Guid JobPositionId { get; set; }
        public JobPosition JobPosition { get; set; } = null!;
        public string ResumeFilePath { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending Review";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? HighestEducationalAttainment { get; set; }
        public string? Institution { get; set; }
        public string? Degree { get; set; }
        public string? YearGraduated { get; set; }

        public ICollection<ApplicantStatusRecord> StatusHistory { get; set; } = new List<ApplicantStatusRecord>();
        public ICollection<InterviewSchedule> InterviewSchedules { get; set; } = new List<InterviewSchedule>();
    }
}
