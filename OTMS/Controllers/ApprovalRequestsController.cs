using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Approval;
using OTMS.Entities.DTOs.Dashboard.Responses;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ApprovalRequestsController(IApprovalRoutingEngine approvalEngine) : ControllerBase
    {
        [Authorize(Policy = "Permissions.Approvals.Submit")]
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitForApproval([FromBody] SubmitApprovalRequestDTO request)
        {
            var result = await approvalEngine.SubmitForApprovalAsync(request);
            if (!result.IsSuccess)
                return BadRequest(result);
            return Ok(result);
        }

        [Authorize(Policy = "Permissions.Approvals.Process")]
        [HttpPost("{id}/decide")]
        public async Task<IActionResult> Decide([FromRoute] Guid id, [FromBody] ApprovalDecisionDTO decision)
        {
            var result = await approvalEngine.ProcessTierDecisionAsync(id, decision);
            if (!result.IsSuccess)
                return BadRequest(result);
            return Ok(result);
        }

        [Authorize(Policy = "Permissions.Approvals.View")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetStatus([FromRoute] Guid id)
        {
            var result = await approvalEngine.GetRequestStatusAsync(id);
            if (!result.IsSuccess)
                return NotFound(result);
            return Ok(result);
        }

        [Authorize(Policy = "Permissions.Approvals.Process")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingApprovals()
        {
            var accountIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdStr) || !Guid.TryParse(accountIdStr, out var accountId))
                return Unauthorized();

            var result = await approvalEngine.GetPendingApprovalsAsync(accountId);
            return Ok(result);
        }

        [Authorize(Policy = "Permissions.Approvals.View")]
        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRequests()
        {
            var accountIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdStr) || !Guid.TryParse(accountIdStr, out var accountId))
                return Unauthorized();

            var result = await approvalEngine.GetMyRequestsAsync(accountId);
            return Ok(result);
        }

        [Authorize(Policy = "Permissions.Approvals.View")]
        [HttpGet("{id}/tracker")]
        public async Task<IActionResult> GetTracker([FromRoute] Guid id)
        {
            var result = await approvalEngine.GetTrackerAsync(id);
            if (!result.IsSuccess)
                return NotFound(result);
            return Ok(result);
        }

        [Authorize(Policy = "Permissions.Approvals.View")]
        [HttpGet("my-trackers")]
        public async Task<IActionResult> GetMyTrackers()
        {
            var accountIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountIdStr) || !Guid.TryParse(accountIdStr, out var accountId))
                return Unauthorized();

            var result = await approvalEngine.GetMyTrackersAsync(accountId);
            return Ok(result);
        }
    }
}
