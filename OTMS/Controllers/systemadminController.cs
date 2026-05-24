using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.AccountManagement;
using OTMS.Entities.DTOs.AccountManagement.Responses;
using OTMS.Service.Interfaces;
using System.ComponentModel.DataAnnotations;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.AccountManagement.Responses;
using OTMS.Data;
using Microsoft.EntityFrameworkCore;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class systemadminController(IAccountManagementService accountManagementService) : ControllerBase
    {

        /// <summary>
        /// Get the Recent Employees from the System. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin, System Admin")]
        [HttpGet("recent-employees")]
        public async Task<IActionResult> GetRecentEmployees()
        {
            var result = await accountManagementService.GetRecentEmployees();
            return Ok(result);
        }


        /// <summary>
        /// Searches for the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin, System Admin")]
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
        /// Searches the Account Status and the system will give the Accounts based on the Account Status (Active, Deactivated, Locked, Inactive). Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin")]
        [ProducesResponseType(typeof(SearchAccountStatusResponseDTO), 200)]
        [HttpGet("search-user-by-status")]
        public async Task<IActionResult> SearchUserByStatus([FromQuery] SearchAccountStatusDTO accountStatus)
        {
            var result = await accountManagementService.GetAccountsByStatus(accountStatus);
            if(result is null || !result.Any())
            {
                return NotFound(new { Message = "No employees found with the specified account status." });
            }
            return Ok(result);
        }

        /// <summary>
        /// Updates the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Roles = "SystemAdmin")]
        [ProducesResponseType(typeof(UpdateEmployeeResponseDTO), 200)]
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
        [ProducesResponseType(typeof(DeactivateUserResponseDTO), 200)]
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
        [ProducesResponseType(typeof(ActivateUserResponseDTO), 200)]
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
        [ProducesResponseType(typeof(AssignUserRoleResponseDTO), 200)]
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
        [ProducesResponseType(typeof(DeleteUserResponseDTO), 200)]
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
