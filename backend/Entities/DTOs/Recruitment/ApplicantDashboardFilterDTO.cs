using OTMS.Entities.DTOs.Pagination;

namespace OTMS.Entities.DTOs.Recruitment
{
    public class ApplicantDashboardFilterDTO : PaginationDTO
    {
        public string? CurrentStatus { get; set; }
        public Guid? JobPositionId { get; set; }
        public string? Search { get; set; }
    }
}
