using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Profile;
using OTMS.Entities.DTOs.Profile.Responses;
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
        [Authorize]
        [HttpGet("view-profile")]
        public async Task<IActionResult> ViewProfile()
        {
            var result = await profileService.ViewProfile();
            if (result is null)
            {
                return NotFound(new ApiResponseDTO<object> { IsSuccess = false, Message = "Employee not found.", Data = null });
            }
            return Ok(new ApiResponseDTO<ViewProfileResponseDTO> { IsSuccess = true, Message = "Profile retrieved successfully.", Data = result });
        }

        /// <summary>
        /// Updates Profile to the System. Only accessible to users that are within the scoped role and authenticated.
        /// </summary>
        [Authorize]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateInformationDTO request)
        {

            try
            {
                var result = await profileService.UpdateBasicInformation(request);
                return Ok(new ApiResponseDTO<UpdateInformationResponseDTO> { IsSuccess = true, Message = "Profile updated successfully.", Data = result });
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
        [Authorize]
        [HttpPatch("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDTO request)
        {
            var result = await profileService.ChangePassword(request);
            if (result is null)
            {
                return NotFound(new ApiResponseDTO<object> { IsSuccess = false, Message = "Employee not found.", Data = null });
            }
            if (!result.Success)
            {
                return BadRequest(new ApiResponseDTO<object> { IsSuccess = false, Message = "Current password is incorrect or Current password is still the same as the new password.", Data = null });
            }
            return Ok(new ApiResponseDTO<ChangePasswordResponseDTO> { IsSuccess = true, Message = "Password changed successfully.", Data = result });
        }
    }
}
