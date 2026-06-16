using System;

namespace OTMS.Entities.DTOs.Recruitment
{
    public class OnboardingLinkResponseDTO
    {
        public Guid ApplicantRecordId { get; set; }
        public string OnboardingUrl { get; set; } = string.Empty;
        public string TokenStatus { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}