using System.Collections.Generic;

namespace OTMS.Entities.DTOs.Dashboard.Responses
{
    public class DashboardResponseDTO
    {
        public int TotalTasksAssigned { get; set; }
        public int TotalActiveTasks { get; set; }
        public int TotalCompletedTasks { get; set; }
        public int TotalOverdueTasks { get; set; }
        public double AverageTasksPerEmployee { get; set; }
        public List<EmployeeWorkloadDTO> EmployeeWorkloadDistribution { get; set; } = new List<EmployeeWorkloadDTO>();
        public Dictionary<string, int> TaskAssignmentDistribution { get; set; } = new Dictionary<string, int>();
    }
}
