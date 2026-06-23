using OTMS.Entities.DTOs.Pagination;

namespace OTMS.Entities.DTOs.Task
{
    public class TaskSearchDTO : PaginationDTO
    {
        public string? TaskTitle { get; set; }
        public Guid? AssignedEmployee { get; set; }
        public string? TaskStatus { get; set; }
        public string? PriorityLevel { get; set; }
        public string? TaskCategory { get; set; }
        public DateTime? DeadlineDate { get; set; }
        public DateTime? DeadlineStartDate { get; set; }
        public DateTime? DeadlineEndDate { get; set; }
        
    }
}
