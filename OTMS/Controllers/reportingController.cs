using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Reporting;
using OTMS.Entities.DTOs.Reporting.Responses;
using OTMS.Service.Interfaces;
using System.Threading.Tasks;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class reportingController(IReportingService reportingService) : ControllerBase
    {
        /// <summary>
        /// Generates a task completion report based on specified filters.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        [ProducesResponseType(typeof(ApiResponseDTO<TaskCompletionReportDTO>), 200)]
        [HttpGet("task-completion")]
        public async Task<IActionResult> GenerateTaskCompletionReport([FromQuery] TaskCompletionReportFilterDTO filter)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await reportingService.GenerateTaskCompletionReportAsync(filter);
            
            if (!result.IsSuccess)
            {
                if (result.Message == "Invalid date range selected. Start date must not be later than end date.")
                {
                    return BadRequest(result);
                }

                return Ok(result); // Return 200 with IsSuccess = false and "No records found"
            }

            return Ok(result);
        }
    }
}
