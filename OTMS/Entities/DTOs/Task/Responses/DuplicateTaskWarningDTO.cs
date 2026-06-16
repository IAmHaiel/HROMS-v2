using System;

namespace OTMS.Entities.DTOs.Task.Responses
{
    public class DuplicateTaskWarningDTO
    {
        public string ExistingTaskTitle { get; set; } = string.Empty;
        public Guid ExistingTaskId { get; set; }
        public string ExistingTaskStatus { get; set; } = string.Empty;
        public double SimilarityPercentage { get; set; }
    }
}
