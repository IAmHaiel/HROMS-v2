namespace OTMS.Entities.DTOs.Task.Responses
{
    public class TaskDeleteResponseDTO
    {
        public bool IsDeleted { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
