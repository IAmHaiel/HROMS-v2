using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.Public;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/public/apply")]
    [ApiController]
    [AllowAnonymous]
    public class publicApplicationController(
        IPublicApplicationService publicApplicationService,
        IConfiguration configuration
        ) : ControllerBase
    {
        [HttpGet("active-positions")]
        public async Task<IActionResult> GetActiveJobPositions()
        {
            var result = await publicApplicationService.GetActiveJobPositionsAsync();
            return Ok(result);
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitApplication([FromForm] ApplicantSubmissionDTO request)
        {
            var result = await publicApplicationService.SubmitApplicationAsync(request);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("config")]
        public IActionResult GetConfig()
        {
            var googleClientId = configuration["GoogleAuth:ClientId"] ?? "";
            return Ok(new { googleClientId });
        }
    }
}
