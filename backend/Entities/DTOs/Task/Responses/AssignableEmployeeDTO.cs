using System;

namespace OTMS.Entities.DTOs.Task.Responses
{
    public class AssignableEmployeeDTO
    {
        public Guid AccountId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int ActiveTaskCount { get; set; }
        public bool IsRecommended { get; set; }
        public string AvailabilityStatus { get; set; } = string.Empty;
        public string RecommendationReason { get; set; } = string.Empty;
    }
}
