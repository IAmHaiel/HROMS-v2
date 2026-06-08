namespace OTMS.Entities.DTOs.Pagination.Response
{
    public class PaginationResponseDTO<T>
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalRecords { get; set; }
        public int TotalPages { get; set; }

        public int? TotalPending { get; set; }
        public int? TotalApproved { get; set; }
        public int? TotalRejected { get; set; }
    }
}
