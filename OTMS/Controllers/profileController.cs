using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.Profile;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class profileController(IProfileService profileService) : ControllerBase
    {
        /// <summary>
        /// View Profile from the System. Only accessible to users that are within the scoped role and authenticated.
        /// </summary>
        [Authorize(Roles = "SystemAdmin,OperationAdmin,Coordinator,Encoder")]
        [HttpGet("view-profile")]
        public async Task<IActionResult> ViewProfile()
        {
            var result = await profileService.ViewProfile();
            if(result is null)
            {
                return NotFound(new { Message = "Employee not found." });
            }
            return Ok(result);
        }

        /// <summary>
        /// Updates Profile to the System. Only accessible to users that are within the scoped role and authenticated.
        /// </summary>
        [Authorize(Roles = "SystemAdmin,OperationAdmin,Coordinator,Encoder")]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile(UpdateInformationDTO request)
        {
            var result = await profileService.UpdateBasicInformation(request);
            if(result is null)
            {
                return NotFound(new { Message = "Employee not found." });
            }
            return Ok(result);
        }

    }
}
