using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.Recruitment;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/recruitment")]
    [ApiController]
    [Authorize]
    public class recruitmentController(IRecruitmentService recruitmentService) : ControllerBase
    {
        [HttpGet("dashboard")]
        [Authorize(Policy = "Permissions.Recruitment.View")]
        public async Task<IActionResult> GetDashboardApplicants([FromQuery] ApplicantDashboardFilterDTO filter)
        {
            var result = await recruitmentService.GetDashboardApplicantsAsync(filter);
            return Ok(result);
        }

        [HttpPut("status")]
        [Authorize(Policy = "Permissions.Recruitment.Manage")]
        public async Task<IActionResult> UpdateApplicantStatus([FromBody] UpdateApplicantStatusDTO request)
        {
            var result = await recruitmentService.UpdateApplicantStatusAsync(request);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("{applicantRecordId}/history")]
        [Authorize(Policy = "Permissions.Recruitment.View")]
        public async Task<IActionResult> GetApplicantStatusHistory(Guid applicantRecordId)
        {
            var result = await recruitmentService.GetApplicantStatusHistoryAsync(applicantRecordId);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        [HttpPost("schedule-interview")]
        [Authorize(Policy = "Permissions.Recruitment.Manage")]
        public async Task<IActionResult> ScheduleInterview([FromBody] InterviewSchedulingDTO request)
        {
            var result = await recruitmentService.ScheduleInterviewAsync(request);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
