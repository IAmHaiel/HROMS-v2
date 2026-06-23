using System.Collections.Generic;

namespace OTMS.Entities.DTOs.Reporting.Responses
{
    public class OperationalSummaryReportDTO
    {
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int OverdueTasks { get; set; }
        public double TaskCompletionRate { get; set; }

        public List<OperationalEmployeePerformanceDTO> EmployeePerformanceSummary { get; set; } = new();
        public List<WorkloadDistributionDTO> WorkloadByCategory { get; set; } = new();
        public List<WorkloadDistributionDTO> WorkloadByDepartment { get; set; } = new();
        public List<WorkloadDistributionDTO> WorkloadByPriority { get; set; } = new();
    }
}
