using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Dashboard;
using OTMS.Entities.DTOs.Dashboard.Responses;
using OTMS.Service.Interfaces;
using System;
using System.Threading.Tasks;

namespace OTMS.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    [Authorize(Policy = "Permissions.Dashboard.View")]
    public class WorkloadDashboardController(IWorkloadDashboardService dashboardService) : ControllerBase
    {
        /// <summary>
        /// Retrieves the Workload Monitoring Dashboard statistics.
        /// </summary>
        [HttpGet("workload")]
        public async Task<ActionResult<ApiResponseDTO<DashboardResponseDTO>>> GetWorkloadDashboard([FromQuery] DashboardFilterDTO filter)
        {
            try
            {
                var result = await dashboardService.GetWorkloadDashboardAsync(filter);
                
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = ex.Message,
                    Data = null
                });
            }
        }
    }
}
