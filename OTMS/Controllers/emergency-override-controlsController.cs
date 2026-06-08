using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.EmergencyOverrideRequest;
using OTMS.Entities.DTOs.EmergencyOverrideRequest.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class emergency_override_controlsController(IEmergencyOverrideService emergencyOverrideService) : ControllerBase
    {
        [HttpPost("request")]
        public async Task<IActionResult> RequestEmergencyOverride(CreateEmergencyOverrideRequestDTO request)
        {
            try
            {
                var result = await emergencyOverrideService.RequestOverrideAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Gets all Emergency Override Requests. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Policy = "HigherRankAccess")]
        [HttpGet("all-requests")]
        public async Task<IActionResult> GetEmergencyOverrideRequests([FromServices] OTMSDbContext context, [FromQuery] PaginationDTO pagination)
        {
            try
            {

                var query = context.EmergencyOverrideRequests
                    .Include(e => e.RequestedBy)
                        .ThenInclude(a => a.Employee)
                    .Where(e => !e.Deleted)
                    .OrderByDescending(e => e.RequestedAt);

                var totalRecords = await query.CountAsync();

                var data = await query
                    .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                    .Take(pagination.PageSize)
                    .Select(e => new EmergencyOverrideResponseDTO
                    {
                        EmergencyOverrideId = e.EmergencyOverrideId,
                        RequestedById = e.RequestedById,
                        LeaveId = e.LeaveId,
                        Status = e.Status.ToString(),
                        Reason = e.Reason,
                        RequestedAt = e.RequestedAt,
                        ApprovedAt = e.ApprovedAt,
                        OverrideUntil = e.OverrideUntil
                    }).ToListAsync();

                return Ok(new PaginationResponseDTO<object> 
                { 
                    IsSuccess = true,
                    Message = "Emergency Override Requests retrieved successfully.",
                    Data = data,
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalRecords = totalRecords,
                    TotalPages = (int)Math.Ceiling(totalRecords / (double)pagination.PageSize)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = $"An error occurred while retrieving emergency override requests: {ex.Message}",
                    Data = null
                });
            }
        }

        [Authorize(Policy = "HigherRankAccess")]
        [HttpPost("approve")]
        public async Task<IActionResult> ApproveEmergencyOverride(ApproveEmergencyOverrideDTO request)
        {
            try
            {
                var result = await emergencyOverrideService.ApproveOverrideAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Declines an Emergency Override Request. Only accessible to users with the "HigherRankAccess" policy.
        /// </summary>
        [Authorize(Policy = "HigherRankAccess")]
        [HttpPost("decline")]
        public async Task<IActionResult> DeclineEmergencyOverride(DeclineEmergencyOverrideDTO request)
        {
            try
            {
                var result = await emergencyOverrideService.DeclineOverrideAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "OperationalTeamAccess")]
        [HttpPut("{emergencyOverrideId}/update")]
        public async Task<IActionResult> UpdateEmergencyOverrideRequest (UpdateEmergencyOverrideDTO request)
        {
            try
            {
                var result = await emergencyOverrideService.UpdateEmergencyOverrideAsync(request);
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

        [Authorize(Policy = "OperationalTeamAccess")]
        [HttpDelete("{emergencyOverrideId}/delete")]
        public async Task<IActionResult> DeleteEmergencyOverrideRequest([FromBody] Guid EmergencyOverrideId)
        {
            try
            {
                var result = await emergencyOverrideService.DeleteEmergencyOverrideAsync(EmergencyOverrideId);
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