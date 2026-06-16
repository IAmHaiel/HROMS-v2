using System;

namespace OTMS.Entities.Models
{
    public class OnboardingToken
    {
        public Guid OnboardingTokenId { get; set; }
        public Guid ApplicantRecordId { get; set; }
        public ApplicantRecord ApplicantRecord { get; set; } = null!;
        public string TokenHash { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UsedAt { get; set; }
        public Guid CreatedByAccountId { get; set; }
        public Account CreatedByAccount { get; set; } = null!;
    }
}