namespace OTMS.Entities.DTOs.Reporting.Responses
{
    public class OperationalEmployeePerformanceDTO
    {
        public string EmployeeName { get; set; } = string.Empty;
        public int Assigned { get; set; }
        public int Completed { get; set; }
        public int Overdue { get; set; }
        public double CompletionRate { get; set; }
    }
}
