namespace OTMS.Entities.DTOs.Profile.Responses
{
    public class UpdateInformationResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;

        public DateTime UpdatedAt { get; set; }

        public bool Success { get; set; }

    }
}
