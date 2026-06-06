using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Task;
using OTMS.Entities.DTOs.Task.Responses;

namespace OTMS.Service.Interfaces
{
    public interface ITaskService
    {
        Task<TaskResponseDTO> CreateTaskAsync(CreateTaskDTO request);
        Task<TaskResponseDTO> UpdateTaskAsync(Guid taskId, UpdateTaskDTO request);
        Task<TaskResponseDTO> ReopenTaskAsync(Guid taskId);
        Task<TaskResponseDTO> UpdateTaskProgressAsync(Guid taskId, UpdateTaskProgressDTO request);
        Task<List<TaskResponseDTO>> GetMyTasksAsync();
        Task<TaskDeleteResponseDTO> DeleteTaskAsync(Guid taskId);
        Task<ApiResponseDTO<TaskResponseDTO>> RestoreTaskAsync (Guid taskId);
        Task<ApiResponseDTO<List<TaskResponseDTO>>> BinRecordsAsync(string EmployeeID);

    }
}
