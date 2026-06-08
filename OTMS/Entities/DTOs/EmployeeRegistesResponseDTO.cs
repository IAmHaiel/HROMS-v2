namespace OTMS.Entities.DTOs
{
    public class EmployeeRegisterResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string GeneratedPassword { get; set; } = string.Empty;
    }
}
