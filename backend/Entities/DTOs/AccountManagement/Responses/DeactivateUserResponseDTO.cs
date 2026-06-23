namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class DeactivateUserResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public bool Success { get; set; }
        public DateTime DeactivatedAt { get; set; }
    }
}
