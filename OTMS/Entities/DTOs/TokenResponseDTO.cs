using OTMS.Entities.DTOs.ActivityLogs.Responses;

namespace OTMS.Entities.DTOs
{
    public class TokenResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public required string AccessToken { get; set; }
        public required string RefreshToken { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = null;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = null;
        public string Role { get; set; } = string.Empty;
        public bool IsPasswordChanged { get; set; }
    }
}
