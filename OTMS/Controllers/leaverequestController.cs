using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OTMS.Entities.DTOs.LeaveRequest;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class leaverequestController(ILeaveRequest leaveRequest) : ControllerBase
    {

        /// <summary>
        /// The system shall allow Operational Team members to submit a formal time-off request by specifying the start date, end date, and reason.
        /// </summary>
        [Authorize(Policy = "ManagementAccess")]
        [HttpPost("create-leave-request")]
        public async Task<IActionResult> CreateLeaveRequest([FromBody] CreateLeaveRequestDTO request)
        {
            try
            {
                var result = await leaveRequest.CreateLeaveRequestAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// The system shall allow Operational Team members to view their own leave requests.
        /// </summary>
        [Authorize(Policy = "ManagementAccess")]
        [HttpPost("my-leave-requests")]
        public async Task<IActionResult> GetMyLeaveRequests(PaginationDTO pagination)
        {
            var accountIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdStr) || !Guid.TryParse(accountIdStr, out var accountId))
                return Unauthorized();

            var result = await leaveRequest.GetMyLeaveRequestsAsync(accountId, pagination);
            return Ok(result);
        }

        /// <summary>
        /// Gets a list of all leave requests in the system. This endpoint is restricted to users with the "OperationAdmin" role, ensuring that only authorized personnel can access this sensitive information.
        /// </summary>
        [Authorize(Policy = "HigherRankAccess")]
        [HttpGet("get-all-leave-requests")]
        public async Task<IActionResult> GetAllLeaveRequests([FromQuery] PaginationDTO request)
        {
            var result = await leaveRequest.GetAllLeaveRequestsAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Update Leave Status of the leave request. This endpoint is restricted to users with the "OperationAdmin" role, ensuring that only authorized personnel can update the status of leave requests.
        /// </summary>
        [Authorize(Policy = "HigherRankAccess")]
        [HttpPut("{leaveId}/status")]
        public async Task<IActionResult> UpdateLeaveStatus(Guid leaveId, [FromBody] UpdateLeaveStatusDTO request)
        {
            var success = await leaveRequest.UpdateLeaveStatusAsync(leaveId, request);

            if (!success)
                return NotFound(new { Message = "Leave request not found." });

            return Ok("Leave Request status updated successfully.");
        }
    }
}
