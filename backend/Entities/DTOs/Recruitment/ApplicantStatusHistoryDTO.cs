namespace OTMS.Entities.DTOs.Recruitment
{
    public class ApplicantStatusHistoryDTO
    {
        public string OldStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public string UpdatedBy { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }
}
