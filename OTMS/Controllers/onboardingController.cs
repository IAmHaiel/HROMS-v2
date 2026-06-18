using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.Recruitment;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [ApiController]
    public class onboardingController(IOnboardingService onboardingService) : ControllerBase
    {
        [HttpPost("api/onboarding/validate")]
        public async Task<IActionResult> ValidateToken([FromBody] ValidateOnboardingTokenDTO request)
        {
            var result = await onboardingService.ValidateOnboardingTokenAsync(request.Token);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("api/onboarding/complete")]
        public async Task<IActionResult> CompleteOnboarding([FromBody] ValidateOnboardingTokenDTO request)
        {
            var result = await onboardingService.CompleteOnboardingAsync(request.Token, request.Password);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("api/recruitment/{applicantRecordId}/onboarding-link")]
        [Authorize(Policy = "Permissions.Recruitment.Manage")]
        public async Task<IActionResult> GetOnboardingLinkStatus(Guid applicantRecordId)
        {
            var result = await onboardingService.GetOnboardingLinkStatusAsync(applicantRecordId);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        [HttpPost("api/recruitment/{applicantRecordId}/resend-onboarding")]
        [Authorize(Policy = "Permissions.Recruitment.Manage")]
        public async Task<IActionResult> ResendOnboardingLink(Guid applicantRecordId)
        {
            var result = await onboardingService.ResendOnboardingLinkAsync(applicantRecordId);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }
    }
}