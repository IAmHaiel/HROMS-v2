using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Reporting;
using OTMS.Entities.DTOs.Reporting.Responses;
using OTMS.Service.Interfaces;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class reportingController(IReportingService reportingService, OTMSDbContext context) : ControllerBase
    {
        /// <summary>
        /// Returns filter options (departments and employees) for report dropdowns.
        /// </summary>
        [Authorize(Policy = "Permissions.Reporting.View")]
        [HttpGet("filter-options")]
        public async Task<IActionResult> GetFilterOptions()
        {
            var departments = await context.Departments
                .Where(d => d.IsActive)
                .Select(d => new ReportFilterOptionDTO { Id = d.DepartmentId, Name = d.Name })
                .ToListAsync();

            var employees = await context.Employees
                .Select(e => new ReportFilterOptionDTO
                {
                    Id = e.EmployeeId,
                    Name = string.Join(" ", new[] { e.FirstName, e.MiddleName, e.LastName, e.Suffix }.Where(n => !string.IsNullOrEmpty(n)))
                })
                .ToListAsync();

            return Ok(new ApiResponseDTO<ReportFilterOptionsDTO>
            {
                IsSuccess = true,
                Message = "Filter options retrieved successfully.",
                Data = new ReportFilterOptionsDTO
                {
                    Departments = departments,
                    Employees = employees
                }
            });
        }

        /// <summary>
        /// Generates a task completion report based on specified filters.
        /// </summary>
        [Authorize(Policy = "Permissions.Tasks.Manage")]
        [ProducesResponseType(typeof(ApiResponseDTO<TaskCompletionReportDTO>), 200)]
        [ProducesResponseType(400)]
        [HttpGet("task-completion")]
        public async Task<IActionResult> GenerateTaskCompletionReport([FromQuery] TaskCompletionReportFilterDTO filter)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await reportingService.GenerateTaskCompletionReportAsync(filter);

                if (!result.IsSuccess)
                {
                    if (result.Message == "Invalid date range selected. Start date must not be later than end date.")
                    {
                        return BadRequest(result);
                    }

                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = "An unexpected error occurred while generating the report.",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Returns operational summary report data as JSON for preview.
        /// </summary>
        [Authorize(Policy = "Permissions.Reporting.View")]
        [ProducesResponseType(typeof(ApiResponseDTO<OperationalSummaryReportDTO>), 200)]
        [ProducesResponseType(400)]
        [HttpGet("operational-summary")]
        public async Task<IActionResult> GetOperationalSummaryPreview([FromQuery] OperationalSummaryReportFilterDTO filter)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await reportingService.GetOperationalSummaryPreviewAsync(filter);

                if (!result.IsSuccess)
                {
                    if (result.Message == "Invalid date range selected. Start date must not be later than end date.")
                        return BadRequest(result);

                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = "An unexpected error occurred while generating the report.",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Generates and downloads the operational summary report in PDF or Excel format.
        /// </summary>
        [Authorize(Policy = "Permissions.Reporting.View")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [HttpGet("operational-summary/download")]
        public async Task<IActionResult> DownloadOperationalSummary([FromQuery] OperationalSummaryReportFilterDTO filter)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var (fileBytes, contentType, fileName) = await reportingService.GenerateOperationalSummaryDownloadAsync(filter);
                return File(fileBytes, contentType, fileName);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = ex.Message,
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = "An unexpected error occurred while generating the report.",
                    Data = null
                });
            }
        }
    }
}
