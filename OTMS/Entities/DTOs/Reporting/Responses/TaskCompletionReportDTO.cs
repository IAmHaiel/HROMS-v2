using System.Collections.Generic;

namespace OTMS.Entities.DTOs.Reporting.Responses
{
    public class TaskCompletionReportDTO
    {
        public int TotalTasksAssigned { get; set; }
        public int TotalTasksCompleted { get; set; }
        public int TotalTasksInProgress { get; set; }
        public int TotalTasksPendingReview { get; set; }
        public int TotalOverdueTasks { get; set; }
        public double TaskCompletionRate { get; set; } // Percentage
        public double AverageTaskCompletionTimeHours { get; set; } // In hours

        public List<EmployeePerformanceDTO> EmployeePerformanceSummary { get; set; } = new List<EmployeePerformanceDTO>();
    }
}
