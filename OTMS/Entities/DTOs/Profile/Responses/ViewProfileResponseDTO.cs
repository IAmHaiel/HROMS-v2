namespace OTMS.Entities.DTOs.Profile.Responses
{
    public class ViewProfileResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public string Role { get; set; } = string.Empty;
        public string AccountStatus { get; set; } = string.Empty;
    }
}
