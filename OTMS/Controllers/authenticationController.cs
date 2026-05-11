using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class authenticationController(IAuthService authService) : ControllerBase
    {

        // Authentication APIs

        /// <summary>
        /// Authenticates the employee and returns JWT tokens.
        /// </summary>
        /// <param name="request">Login credentials.</param>
        /// <response code="200">Login successful. Access token returned.</response>
        /// <response code="400">Invalid request payload or missing fields.</response>
        /// <response code="500">Unexpected server error.</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(TokenResponseDTO), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<TokenResponseDTO>> Login(EmployeeLoginDTO request)
        {
            var result = await authService.LoginAsync(request);
            if (result is null)
            {
                return Unauthorized(new { message = "Invalid Employee ID or password." });
            }
            return Ok(result);
        }

        /// <summary>
        /// Uses the Refresh Token to generate a new Access Token for Authentication.
        /// </summary>
        /// <param name="request">User credentials.</param>
        /// <response code="200">Refresh Token successful. Access token and Refresh Token returned.</response>
        /// <response code="401">Invalid request payload or missing fields.</response>
        /// <response code="500">Unexpected server error.</response>
        [HttpPost("refresh-token")]
        [ProducesResponseType(typeof(RefreshTokenRequestDTO), 200)]
        [ProducesResponseType(typeof(RefreshTokenRequestDTO), 401)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<TokenResponseDTO>> RefreshToken(RefreshTokenRequestDTO request)
        {
            var result = await authService.RefreshTokensAsync(request);
            if (result is null
                || result.AccessToken is null
                || result.RefreshToken is null)
            {
                return Unauthorized("Invalid refresh token.");
            }

            return Ok(result);
        }

    }
}