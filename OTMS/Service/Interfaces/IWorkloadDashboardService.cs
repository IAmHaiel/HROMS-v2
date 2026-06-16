using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Dashboard;
using OTMS.Entities.DTOs.Dashboard.Responses;

namespace OTMS.Service.Interfaces
{
    public interface IWorkloadDashboardService
    {
        Task<ApiResponseDTO<DashboardResponseDTO>> GetWorkloadDashboardAsync(DashboardFilterDTO filter, Guid accountId);

        Task<ApiResponseDTO<List<WorkflowTrackerDTO>>> GetEmployeeWorkflowTrackersAsync(Guid accountId);

        Task<ApiResponseDTO<List<EmployeeFilterDTO>>> GetFilterEmployeesAsync();

        Task<ApiResponseDTO<List<DepartmentFilterDTO>>> GetFilterDepartmentsAsync();
    }
}
