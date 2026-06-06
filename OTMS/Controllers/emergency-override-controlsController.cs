using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.EmergencyOverrideRequest;
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
        public async Task<IActionResult> GetEmergencyOverrideRequests([FromServices] OTMSDbContext context)
        {
            try
            {
                var requests = await (
                    from e in context.EmergencyOverrideRequests
                    join a in context.Accounts on e.RequestedById equals a.AccountId
                    join emp in context.Employees on a.EmployeeId equals emp.EmployeeId
                    orderby e.RequestedAt descending
                    select new
                    {
                        emergencyOverrideId = e.EmergencyOverrideId,
                        requestedById = e.RequestedById,
                        employeeNumber = emp.EmployeeNumber,
                        employeeName = emp.EmployeeName,
                        leaveId = e.LeaveId,
                        reason = e.Reason,
                        status = e.Status,
                        requestedAt = e.RequestedAt,
                        approvedAt = e.ApprovedAt,
                        overrideUntil = e.OverrideUntil,
                    }
                ).ToListAsync();
                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
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
    }
}