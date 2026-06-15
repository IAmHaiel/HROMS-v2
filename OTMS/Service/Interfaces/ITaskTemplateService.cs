using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.DTOs.TaskTemplate;
using System;
using System.Threading.Tasks;

namespace OTMS.Service.Interfaces
{
    public interface ITaskTemplateService
    {
        Task<TaskTemplateResponseDTO> CreateTaskTemplateAsync(TaskTemplateCreationDTO request);
        Task<TaskTemplateResponseDTO> UpdateTaskTemplateAsync(Guid templateId, TaskTemplateUpdateDTO request);
        Task<TaskTemplateResponseDTO> ToggleTemplateStatusAsync(Guid templateId);
        Task<PaginationResponseDTO<TaskTemplateResponseDTO>> GetTaskTemplatesAsync(PaginationDTO request);
    }
}
