namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class UpdateEmployeeResponseDTO
    {
        public string EmployeeNumber { get; set; } = String.Empty;
        public string EmployeeName { get; set; } = String.Empty;
        public string ContactNumber { get; set; } = String.Empty;
        public bool Success { get; set; }
    }
}
