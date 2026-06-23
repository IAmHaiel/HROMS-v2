namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class UpdateEmployeeResponseDTO
    {
        public string EmployeeNumber { get; set; } = String.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = null;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = null;
        public string ContactNumber { get; set; } = String.Empty;
        public string Email {  get; set; } = String.Empty;
        public bool Success { get; set; }
    }
}
