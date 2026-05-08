using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs.AccountManagement;
using OTMS.Service.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class systemadminController(IAccountManagementService accountManagementService) : ControllerBase
    {

        /// <summary>
        /// Get the Recent Employees from the System. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin")]
        [HttpGet("recent-employees")]
        public async Task<IActionResult> GetRecentEmployees()
        {
            var result = await accountManagementService.GetRecentEmployees();
            return Ok(result);
        }


        /// <summary>
        /// Searches for the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin")]
        [HttpGet("search-user")]
        public async Task<IActionResult> SearchUser([FromQuery] SearchUserDTO employeeNumber)
        {
            var result = await accountManagementService.SearchUser(employeeNumber);
            if(result is null)
            {
                return NotFound(new { Message = "Employee not found." });
            }
            return Ok(result);
        }

        /// <summary>
        /// Updates the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin")]
        [HttpPut("update-user")]
        public async Task<IActionResult> UpdateUser([Required][FromQuery]string employeeNumber, UpdateEmployeeDTO request)
        {
            var result = await accountManagementService.UpdateEmployee(employeeNumber, request);
            if(result is null)
            {
                return NotFound(new { Message = "Employee not found." });
            }
            return Ok(result);
        }


        /// <summary>
        /// Deactivates the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin")]
        [HttpPatch("deactivate-user")]
        public async Task<IActionResult> DeactivateUser(DeactivateUserDTO request)
        {
            var result = await accountManagementService.DeactivateUser(request);

            if(result is null)
            {
                return NotFound(new { Message = "Employee not found." });
            }

            return Ok(result);
        }

        /// <summary>
        /// Activates the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin")]
        [HttpPatch("activate-user")]
        public async Task<IActionResult> ActivateUser(DeactivateUserDTO request)
        {
            var result = await accountManagementService.ActivateUser(request);

            if(result is null)
            {
                return NotFound(new { Message = "Employee not found." });
            }

            return Ok(result);
        }

        /// <summary>
        /// Assigns a Role for the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin")]
        [HttpPatch("assign-role")]
        public async Task<IActionResult> AssignUserRole(AssignUserRoleDTO request)
        {
            var result = await accountManagementService.AssignUserRole(request);
            if(result is null)
            {
                return NotFound(new { Message = "Employee not found." });
            }
            return Ok(result);
        }


        /// <summary>
        /// Deletes the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin")]
        [HttpDelete("delete-user")]
        public async Task<IActionResult> DeleteUser(DeactivateUserDTO request)
        {
            var result = await accountManagementService.DeleteUser(request);

            if(result is null)
            {
                return NotFound(new { Message = "Employee not found." });
            }

            return Ok(result);
        }

    }
}
