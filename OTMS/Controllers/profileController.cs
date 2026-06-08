using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs;
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
        [Authorize(Policy = "ManagementAccess")]
        [HttpGet("view-profile")]
        public async Task<IActionResult> ViewProfile()
        {
            var result = await profileService.ViewProfile();
            if (result is null)
            {
                return NotFound(new { Message = "Employee not found." });
            }
            return Ok(result);
        }

        /// <summary>
        /// Updates Profile to the System. Only accessible to users that are within the scoped role and authenticated.
        /// </summary>
        [Authorize(Policy = "ManagementAccess")]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile(UpdateInformationDTO request)
        {

            try
            {
                var result = await profileService.UpdateBasicInformation(request);
                return Ok(result);
            }
            catch(Exception ex)
            {
                return BadRequest(new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = ex.Message,
                    Data = null
                });
            }
            
        }

        /// <summary>
        /// Changes Password of the User's Account to the System. Only accessible to users that are within the scoped role and authenticated.
        /// </summary>
        [Authorize(Policy = "ManagementAccess")]
        [HttpPatch("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDTO request)
        {
            var result = await profileService.ChangePassword(request);
            if (result is null)
            {
                return NotFound(new { Message = "Employee not found." });
            }
            if (!result.Success)
            {
                return BadRequest(new { Message = "Current password is incorrect or Current password is still the same as the new password." });
            }
            return Ok(result);
        }
    }
}
