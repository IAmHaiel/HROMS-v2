using System.Threading.Tasks;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Dashboard;
using OTMS.Entities.DTOs.Dashboard.Responses;

namespace OTMS.Service.Interfaces
{
    public interface IWorkloadDashboardService
    {
        Task<ApiResponseDTO<DashboardResponseDTO>> GetWorkloadDashboardAsync(DashboardFilterDTO filter);

        Task<ApiResponseDTO<List<WorkflowTrackerDTO>>> GetEmployeeWorkflowTrackersAsync(Guid accountId);
    }
}
