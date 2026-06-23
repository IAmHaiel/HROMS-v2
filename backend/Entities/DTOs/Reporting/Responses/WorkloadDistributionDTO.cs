namespace OTMS.Entities.DTOs.Reporting.Responses
{
    public class WorkloadDistributionDTO
    {
        public string CategoryName { get; set; } = string.Empty;
        public int TaskCount { get; set; }
        public double Percentage { get; set; }
    }
}
