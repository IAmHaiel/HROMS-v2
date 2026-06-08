using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.AccountManagement;
using OTMS.Entities.DTOs.AccountManagement.Responses;
using OTMS.Entities.DTOs.AccountManagement.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Service.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class systemadminController(IAccountManagementService accountManagementService, ISystemAdminService systemAdminService) : ControllerBase
    {

        /// <summary>
        /// Initializes the System Admin Account by Registering the Email and Password to the System.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpPost("create-account")]
        [ProducesResponseType(typeof(ApiResponseDTO<object>), 200)]
        public async Task<IActionResult> InitializeSystemAdminAccount([FromBody] SystemAdminCreationDTO request)
        {
            try
            {
                // Checks if there is an existing System Admin Account in the System.
                await systemAdminService.CheckSystemAdminExistence();

                if (string.IsNullOrEmpty(request.Email))
                    return BadRequest(new ApiResponseDTO<object>
                    {
                        IsSuccess = false,
                        Message = "The Email field is empty.",
                        Data = null
                    });

                if (string.IsNullOrEmpty(request.Password))
                    return BadRequest(new ApiResponseDTO<object>
                    {
                        IsSuccess = false,
                        Message = "The Password field is empty.",
                        Data = null
                    });

                var result = await systemAdminService.CreateSystemAdminAccount(request);
                return Ok(result);
            }
            catch (Exception ex)
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
        /// Get the Recent Employees from the System. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Policy = "SystemAdminAccess")]
        [HttpGet("recent-employees")]
        public async Task<IActionResult> GetRecentEmployees([FromQuery] PaginationDTO request, [FromQuery] string? search, [FromQuery] string? role, [FromQuery] string? status)
        {
            var result = await accountManagementService.GetRecentEmployees(request, search, role, status);
            return Ok(result);
        }


        /// <summary>
        /// Searches for the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Policy = "SystemAdminAccess")]
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
        [Authorize(Policy = "SystemAdminAccess")]
        [ProducesResponseType(typeof(SearchAccountStatusResponseDTO), 200)]
        [HttpGet("search-user-by-status")]
        public async Task<IActionResult> SearchUserByStatus([FromQuery] SearchAccountStatusDTO accountStatus)
        {
            var result = await accountManagementService.GetAccountsByStatus(accountStatus);
            if(result is null)
            {
                return NotFound(new { Message = "No employees found with the specified account status." });
            }
            return Ok(result);
        }

        /// <summary>
        /// Allows the Operation Admin to view the list of employees that can be assigned to tasks.
        /// </summary>
        [Authorize(Policy = "OperationAdminAccess")]
        [HttpGet("assignable-employees")]
        public async Task<ActionResult> GetAssignableEmployees([FromServices] OTMSDbContext context, [FromQuery] PaginationDTO pagination, string? NameFilter)
        {
            try
            {
                var query = context.Accounts
                    .Include(a => a.Employee)
                    .Include(a => a.ActivityLogs)
                    .Where(a => a.Role == Common.Constraints.Roles.Encoder || a.Role == Common.Constraints.Roles.Coordinator)
                    .OrderByDescending(a =>
                        a.Employee.FirstName.Contains(NameFilter)
                        || a.Employee.MiddleName.Contains(NameFilter)
                        || a.Employee.LastName.Contains(NameFilter)
                        || a.Employee.Suffix.Contains(NameFilter));

                var totalRecords = await query.CountAsync();

                var data = await query
                    .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                    .Take(pagination.PageSize)
                    .Select(a => new {
                        accountId = a.AccountId,
                        firstName = a.Employee.FirstName,
                        middleName = a.Employee.MiddleName,
                        lastName = a.Employee.LastName,
                        suffix = a.Employee.Suffix,
                        role = a.Role,
                        presenceStatus = a.ActivityLogs
                            .OrderByDescending(al => al.CreatedAt)
                            .Select(al => al.ActivityType == "Login"
                                ? "Online"
                                : al.ActivityType == "Logout"
                                    ? "Offline"
                                    : "Offline")
                            .FirstOrDefault() ?? "Offline"
                    }).ToListAsync();

                return Ok(new PaginationResponseDTO<object>
                {
                    IsSuccess = true,
                    Message = "Assignable employees retrieved successfully.",
                    Data = data,
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalRecords = totalRecords,
                    TotalPages = (int)Math.Ceiling(totalRecords / (double)pagination.PageSize)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = $"An error occurred while retrieving assignable employees: {ex.Message}",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Updates the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Policy = "SystemAdminAccess")]
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
        [Authorize(Policy = "SystemAdminAccess")]
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
        [Authorize(Policy = "SystemAdminAccess")]
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
        [Authorize(Policy = "SystemAdminAccess")]
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
        [Authorize(Policy = "SystemAdminAccess")]
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
