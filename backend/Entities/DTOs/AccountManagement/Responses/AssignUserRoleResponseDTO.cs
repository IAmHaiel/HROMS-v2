namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class AssignUserRoleResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public bool Success { get; set; }
        public DateTime AssignedAt { get; set; }
    }
}
