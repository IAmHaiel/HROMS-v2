using OTMS.Entities.DTOs.Pagination;

namespace OTMS.Entities.DTOs.AccountManagement
{
    public class SearchAccountStatusDTO
    {
        public string Status { get; set; } = string.Empty;
        public PaginationDTO Pagination { get; set; } = new PaginationDTO();
    }
}
