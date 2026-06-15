using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Reporting;
using OTMS.Entities.DTOs.Reporting.Responses;
using System.Threading.Tasks;

namespace OTMS.Service.Interfaces
{
    public interface IReportingService
    {
        Task<ApiResponseDTO<TaskCompletionReportDTO>> GenerateTaskCompletionReportAsync(TaskCompletionReportFilterDTO filter);
    }
}
