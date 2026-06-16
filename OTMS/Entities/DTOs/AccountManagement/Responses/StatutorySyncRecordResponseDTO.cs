using System;

namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class StatutorySyncRecordResponseDTO
    {
        public Guid SyncRecordId { get; set; }
        public string TargetSystem { get; set; } = string.Empty;
        public string SyncStatus { get; set; } = string.Empty;
        public DateTime SyncTimestamp { get; set; }
        public string? ErrorMessage { get; set; }
    }
}