using OTMS.Entities.DTOs.Task;
using OTMS.Entities.DTOs.Task.Responses;

namespace OTMS.Service.Interfaces
{
    public interface ITaskService
    {
        Task<TaskResponseDTO> CreateTaskAsync(CreateTaskDTO request);
    }
}
