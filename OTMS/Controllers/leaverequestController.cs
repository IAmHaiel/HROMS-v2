using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.LeaveRequest;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class leaverequestController(ILeaveRequest leaveRequest) : ControllerBase
    {

        /// <summary>
        /// The system shall allow Operational Team members to submit a formal time-off request by specifying the start date, end date, and reason.
        /// </summary>
        [Authorize(Roles = "SystemAdmin,OperationAdmin,Coordinator,Encoder")]
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

    }
}
