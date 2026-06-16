namespace OTMS.Entities.DTOs.Pagination
{
    public class PaginationDTO
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SortBy { get; set; }
        public string? SortOrder { get; set; }
    }
}
