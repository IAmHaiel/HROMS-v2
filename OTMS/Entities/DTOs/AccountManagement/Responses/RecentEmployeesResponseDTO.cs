using OTMS.Entities.DTOs.Pagination;

namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class RecentEmployeesResponseDTO
    {
        public string EmployeeNumber { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = null;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = null;
        public string ContactNumber { get; set; }
        public string Role { get; set; }
        public string AccountStatus { get; set; }
        public string PresenceStatus { get; set; } = "Offline";
        public string Email { get; set; } = string.Empty;
        public PaginationDTO Pagination { get; set; } = new PaginationDTO();

    }
}
