namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class DeleteUserResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public bool Success { get; set; }
        public DateTime DeletedAt { get; set; }
    }
}
