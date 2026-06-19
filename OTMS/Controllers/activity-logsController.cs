using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.ActivityLogs.Responses;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/activity-logs")]
    [ApiController]
    public class activity_logsController(IActivityLogService activityLogService) : ControllerBase
    {
        /// <summary>   
        /// Get the presence status of an employee based on their recent activity logs. The presence status is determined by the last activity timestamp, indicating whether the employee is currently online or offline. System Admins can only access this endpoint.
        /// </summary>
        [Authorize(Policy = "Permissions.SystemAdmin.FullAccess")]
        [HttpGet("presence/{employeeId}")]
        public async Task<ActionResult<PresenceResponseDTO>> GetPresence(Guid employeeId)
        {
            try { 
                var presence = await activityLogService.GetPresenceAsync(employeeId);
                return Ok(presence);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>   
        /// Get the online activity (Online|Offline) of an Account, it can be accessed under Operational Team.
        /// </summary>
        [Authorize]
        [HttpGet("online-activity/{employeeId}")]
        public async Task<ActionResult<string>> GetEmployeeOnlineActivity(Guid employeeId)
        {
            try
            {
                var onlineActivity = await activityLogService.GetOnlineActivityAsync(employeeId);
                return Ok(onlineActivity);
            } 
            catch (Exception ex)
            {
                return NotFound(new {message = ex.Message});
            }
        }
        /// <summary>
        /// Get recent activity logs for System Admins.
        /// </summary>
        [Authorize(Policy = "Permissions.SystemAdmin.FullAccess")]
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentActivityLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null, [FromQuery] string? employeeId = null, [FromQuery] string? activityType = null,
            [FromQuery] string? dateFrom = null, [FromQuery] string? dateTo = null)
        {
            try
            {
                var logs = await activityLogService.GetRecentActivityLogsPagedAsync(page, pageSize, search, employeeId, activityType, dateFrom, dateTo);
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
        /// <summary>
        /// Get paginated activity logs for the currently authenticated user.
        /// </summary>
        [Authorize]
        [HttpGet("my-logs")]
        public async Task<IActionResult> GetMyActivityLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var accountIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountIdClaim) || !Guid.TryParse(accountIdClaim, out var accountId))
                    return Unauthorized(new { message = "Invalid user token." });

                var logs = await activityLogService.GetMyActivityLogsPagedAsync(accountId, page, pageSize);
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get activity logs for a specific employee.
        /// </summary>
        [Authorize(Policy = "Permissions.SystemAdmin.FullAccess")]
        [HttpGet("employee/{employeeNumber}")]
        public async Task<IActionResult> GetEmployeeActivityLogs(string employeeNumber)
        {
            try
            {
                var logs = await activityLogService.GetEmployeeActivityLogsAsync(employeeNumber);
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
