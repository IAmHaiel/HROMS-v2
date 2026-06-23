namespace OTMS.Entities.Models
{
    public class ApplicantStatusRecord
    {
        public Guid ApplicantStatusRecordId { get; set; }
        public Guid ApplicantRecordId { get; set; }
        public ApplicantRecord ApplicantRecord { get; set; } = null!;
        public string OldStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public Guid UpdatedById { get; set; }
        public Account Updater { get; set; } = null!;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
