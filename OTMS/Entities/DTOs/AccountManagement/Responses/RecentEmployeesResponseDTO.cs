using OTMS.Entities.DTOs.Pagination;

namespace OTMS.Entities.DTOs.AccountManagement.Responses
{
    public class RecentEmployeesResponseDTO
    {
        public string EmployeeNumber { get; set; }
        public string EmployeeName { get; set; }
        public string ContactNumber { get; set; }
        public string Role { get; set; }
        public string AccountStatus { get; set; }
        public string PresenceStatus { get; set; } = "Offline";
        public PaginationDTO Pagination { get; set; } = new PaginationDTO();

    }
}
