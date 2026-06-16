namespace OTMS.Entities.DTOs.Recruitment
{
    public class ApplicantRecordDTO
    {
        public Guid ApplicantRecordId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string JobPositionName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
