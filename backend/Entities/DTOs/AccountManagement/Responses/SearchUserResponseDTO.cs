namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class SearchUserResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = null;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = null;
        public string Role { get; set; } = string.Empty;
        public string AccountStatus { get; set; } = string.Empty;
        public string PresenceStatus { get; set; } = "Offline";
        public bool Success { get; set; }
        public List<EmployeeAttachmentDTO>? Attachments { get; set; }
    }
}
