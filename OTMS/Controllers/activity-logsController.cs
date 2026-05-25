using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.ActivityLogs.Responses;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class activity_logsController(IActivityLogService activityLogService) : ControllerBase
    {
        /// <summary>   
        /// Get the presence status of an employee based on their recent activity logs. The presence status is determined by the last activity timestamp, indicating whether the employee is currently online or offline. System Admins can only access this endpoint.
        /// </summary>
        [Authorize(Policy = "SystemAdminAccess")]
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
    }

}
