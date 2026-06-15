namespace OTMS.Entities.DTOs.Reporting.Responses
{
    public class EmployeePerformanceDTO
    {
        public string EmployeeName { get; set; } = string.Empty;
        public int TotalAssigned { get; set; }
        public int TotalCompleted { get; set; }
        public double CompletionRate { get; set; }
        public double AverageCompletionTimeHours { get; set; }
    }
}
