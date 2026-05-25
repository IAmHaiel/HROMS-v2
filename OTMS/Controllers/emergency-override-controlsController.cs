using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.EmergencyOverrideRequest;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class emergency_override_controlsController(IEmergencyOverrideService emergencyOverrideService) : ControllerBase
    {
        [Authorize(Policy = "OperationalTeamAccess")]
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
    }
}
