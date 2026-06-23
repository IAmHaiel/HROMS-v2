namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class ActivateUserResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public bool Success { get; set; }
        public DateTime ActivatedAt { get; set; }
    }
}
