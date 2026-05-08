using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using OTMS.Service.Services;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class authorizationController(IAuthService authService) : ControllerBase
    {
        // Secured APIs

        /// <summary>
        /// Checks if the User is Authenticated.
        /// </summary>
        /// <response code="200">User is authenticated.</response>
        /// <response code="401">User is not authenticated.</response>
        /// <response code="500">Unexpected server error.</response>
        [Authorize]
        [HttpGet("authorize-user")]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        
        [ProducesResponseType(500)]
        public IActionResult AuthenticatedOnlyEndpoint()
        {
            return Ok("You are authenticated");
        }

        // Role-Based Access

        // Changing the Roles to a string array to allow multiple roles
        /// <summary>
        /// Only accessible to users with the "Admin" role.
        /// </summary>
        /// <response code="200">User is an "Admin" and is authorized.</response>
        /// <response code="401">User is not authorized.</response>
        /// <response code="403">User is not the "Admin".</response>
        /// <response code="500">Unexpected server error.</response>
        [Authorize(Roles = "Admin")]
        [HttpGet("admin-only")]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(500)]
        public IActionResult AdminOnlyEndpoint()
        {
            return Ok("You are admin!");
        }

        // Register Account only accessible and used by SystemAdmin
        /// <summary>
        /// Registers a new employee account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        /// <response code="200">User is authorized as a "SystemAdmin".</response>
        /// <response code="401">User is not authorized.</response>
        /// <response code="403">User is not the "SystemAdmin".</response>
        /// <response code="500">Unexpected server error.</response>
        [Authorize(Roles = "SystemAdmin")]
        [HttpPost("systemadmin/register")]
        [ProducesResponseType(typeof(EmployeeRegisterDTO), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> Register(EmployeeRegisterDTO request)
        {
            var result = await authService.RegisterAsync(request);

            if (result == null)
                return BadRequest("Registration failed");

            return Ok(result);
        }
    }
}