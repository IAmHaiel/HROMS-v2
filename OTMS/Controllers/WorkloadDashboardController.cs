using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Dashboard;
using OTMS.Entities.DTOs.Dashboard.Responses;
using OTMS.Service.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace OTMS.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    [Authorize(Policy = "Permissions.Dashboard.View")]
    public class WorkloadDashboardController(IWorkloadDashboardService dashboardService) : ControllerBase
    {
        /// <summary>
        /// Retrieves workflow tracker data for the logged-in employee's approval requests.
        /// </summary>
        [HttpGet("workflow-trackers")]
        public async Task<ActionResult<ApiResponseDTO<List<WorkflowTrackerDTO>>>> GetWorkflowTrackers()
        {
            try
            {
                var accountIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountIdStr) || !Guid.TryParse(accountIdStr, out var accountId))
                    return Unauthorized();

                var result = await dashboardService.GetEmployeeWorkflowTrackersAsync(accountId);
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
