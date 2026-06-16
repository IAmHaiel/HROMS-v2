using System;

namespace OTMS.Entities.DTOs.Dashboard.Responses
{
    public class EmployeeWorkloadDTO
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int TotalAssigned { get; set; }
        public int ActiveTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
    }
}
