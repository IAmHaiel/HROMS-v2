namespace OTMS.Entities.DTOs
{
    public class EmployeeRegisterResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = null;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = null;
        public string ContactNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string GeneratedPassword { get; set; } = string.Empty;
    }
}
