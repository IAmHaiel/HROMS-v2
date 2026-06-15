using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.DTOs.Task;
using OTMS.Entities.DTOs.Task.Responses;

namespace OTMS.Service.Interfaces
{
    public interface ITaskService
    {
        Task<TaskResponseDTO> CreateTaskAsync(CreateTaskDTO request);
        Task<TaskResponseDTO> UpdateTaskAsync(Guid taskId, UpdateTaskDTO request);
        Task<ApiResponseDTO<PaginationResponseDTO<TaskResponseDTO>>> SearchTasksAsync(TaskSearchDTO request);
        Task<TaskResponseDTO> RequestReopenTaskAsync(Guid taskId, RequestReopenDTO request);
        Task<TaskResponseDTO> ReviewReopenRequestAsync(Guid requestId, ReviewReopenDTO request);
        Task<TaskResponseDTO> UpdateTaskProgressAsync(Guid taskId, UpdateTaskProgressDTO request);
        Task<PaginationResponseDTO<TaskResponseDTO>> GetMyTasksAsync(PaginationDTO request);
        Task<TaskDeleteResponseDTO> DeleteTaskAsync(Guid taskId);
        Task<ApiResponseDTO<TaskResponseDTO>> RestoreTaskAsync(Guid taskId);
        Task<ApiResponseDTO<PaginationResponseDTO<TaskResponseDTO>>> BinRecordsAsync(string EmployeeID, PaginationDTO pagination);
        Task<ApiResponseDTO<object>> EmptyBinAsync(string EmployeeID);
        Task<ApiResponseDTO<PaginationResponseDTO<AssignableEmployeeDTO>>> GetAssignableEmployeesAsync(PaginationDTO pagination, string? nameFilter);

    }
}
