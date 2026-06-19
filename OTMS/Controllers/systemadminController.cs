using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.AccountManagement;
using OTMS.Entities.DTOs.AccountManagement.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Service.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class systemadminController(
        IAccountManagementService accountManagementService, 
        ISystemAdminService systemAdminService,
        IAuthorizationService authorizationService,
        OTMSDbContext context
    ) : ControllerBase
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
        [Authorize(Policy = "Permissions.Users.Manage")]
        [HttpGet("recent-employees")]
        public async Task<IActionResult> GetRecentEmployees([FromQuery] PaginationDTO request, [FromQuery] string? search, [FromQuery] string? role, [FromQuery] string? status)
        {
            var result = await accountManagementService.GetRecentEmployees(request, search, role, status);
            return Ok(result);
        }


        /// <summary>
        /// Searches for the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Policy = "Permissions.Users.Manage")]
        [HttpGet("search-user")]
        public async Task<IActionResult> SearchUser([FromQuery] SearchUserDTO employeeNumber)
        {
            var result = await accountManagementService.SearchUser(employeeNumber);
            if(result is null)
            {
                return NotFound(new ApiResponseDTO<object> { IsSuccess = false, Message = "Employee not found.", Data = null });
            }
            return Ok(new ApiResponseDTO<SearchUserResponseDTO> { IsSuccess = true, Message = "Employee found successfully.", Data = result });
        }

        /// <summary>
        /// Searches the Account Status and the system will give the Accounts based on the Account Status (Active, Deactivated, Locked, Inactive). Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Policy = "Permissions.Users.Manage")]
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
        [Authorize(Policy = "Permissions.Users.View")]
        [HttpGet("assignable-employees")]
        public async Task<ActionResult> GetAssignableEmployees([FromServices] OTMSDbContext context, [FromQuery] PaginationDTO pagination, string? NameFilter)
        {
            try
            {
                var query = context.Accounts
                    .Include(a => a.Employee)
                    .Include(a => a.ActivityLogs)
                    .Where(a => a.Role != null && (a.Role.Name == Common.Constraints.Roles.Encoder || a.Role.Name == Common.Constraints.Roles.Coordinator))
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
        [Authorize(Policy = "Permissions.Users.Manage")]
        [ProducesResponseType(typeof(UpdateEmployeeResponseDTO), 200)]
        [HttpPut("update-user")]
        public async Task<IActionResult> UpdateUser([Required][FromQuery]string employeeNumber, [FromBody] UpdateEmployeeJsonDTO request)
        {
            try
            {
                var mapped = new UpdateEmployeeDTO
                {
                    EmployeeNumber = request.EmployeeNumber,
                    FirstName = request.FirstName,
                    MiddleName = request.MiddleName,
                    LastName = request.LastName,
                    Suffix = request.Suffix,
                    ContactNumber = request.ContactNumber,
                    Email = request.Email
                };
                var result = await accountManagementService.UpdateEmployee(employeeNumber, mapped);
                if (result == null)
                {
                    return BadRequest(new ApiResponseDTO<object> { IsSuccess = false, Message = "Employee not found.", Data = null });
                }
                return Ok(new ApiResponseDTO<UpdateEmployeeResponseDTO> { IsSuccess = true, Message = "Employee updated successfully.", Data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponseDTO<object> { IsSuccess = false, Message = ex.Message, Data = null });
            }
        }


        /// <summary>
        /// Deactivates the User Account. Only accessible to users with the "SystemAdmin" role.
        /// </summary>
        [Authorize(Policy = "Permissions.Users.Manage")]
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
        [Authorize(Policy = "Permissions.Users.Manage")]
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
        [Authorize(Policy = "Permissions.Users.Manage")]
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
        [Authorize(Policy = "Permissions.Users.Manage")]
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

        /// <summary>
        /// View the complete Digital 201 File of an employee.
        /// </summary>
        [Authorize]
        [ProducesResponseType(typeof(ApiResponseDTO<Digital201FileResponseDTO>), 200)]
        [HttpGet("digital-201-file")]
        public async Task<IActionResult> GetDigital201File([Required][FromQuery] string employeeNumber, [FromServices] IActivityLogService activityLogService)
        {
            var authResult = await authorizationService.AuthorizeAsync(User, "Permissions.Users.View");
            if (!authResult.Succeeded)
            {
                var claimProfile = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(claimProfile))
                {
                    return Forbid();
                }

                var isOwnFile = await context.Employees
                    .AnyAsync(e => e.Account.AccountId.ToString() == claimProfile && e.EmployeeNumber == employeeNumber);

                if (!isOwnFile)
                {
                    return Forbid();
                }
            }

            var result = await accountManagementService.GetDigital201File(employeeNumber);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            var accountIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(accountIdStr, out Guid accountId))
            {
                await activityLogService.LogActivityAsync(accountId, "Read", $"Viewed Digital 201 File of Employee {employeeNumber}");
            }

            return Ok(result);
        }

        /// <summary>
        /// Upload a document to an employee's Digital 201 File.
        /// </summary>
        [Authorize(Policy = "Permissions.Users.Manage")]
        [ProducesResponseType(typeof(ApiResponseDTO<EmployeeAttachmentDTO>), 200)]
        [HttpPost("documents/upload")]
        public async Task<IActionResult> UploadEmployeeDocument([Required][FromQuery] string employeeNumber, [FromForm] UploadEmployeeDocumentDTO request, [FromServices] IActivityLogService activityLogService)
        {

            var result = await accountManagementService.UploadEmployeeDocument(employeeNumber, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            var accountIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(accountIdStr, out Guid accountId))
            {
                await activityLogService.LogActivityAsync(accountId, "Create", $"Uploaded {request.DocumentType} document for Employee {employeeNumber}");
            }

            return Ok(result);
        }

        /// <summary>
        /// Update a document in an employee's Digital 201 File.
        /// </summary>
        [Authorize(Policy = "Permissions.Users.Manage")]
        [ProducesResponseType(typeof(ApiResponseDTO<EmployeeAttachmentDTO>), 200)]
        [HttpPut("documents/{attachmentId}")]
        public async Task<IActionResult> UpdateEmployeeDocument([FromRoute] Guid attachmentId, [FromForm] UpdateEmployeeDocumentDTO request)
        {
            var result = await accountManagementService.UpdateEmployeeDocument(attachmentId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Archive a document in an employee's Digital 201 File.
        /// </summary>
        [Authorize(Policy = "Permissions.Users.Manage")]
        [ProducesResponseType(typeof(ApiResponseDTO<object>), 200)]
        [HttpPatch("documents/{attachmentId}/archive")]
        public async Task<IActionResult> ArchiveEmployeeDocument([FromRoute] Guid attachmentId)
        {
            var result = await accountManagementService.ArchiveEmployeeDocument(attachmentId);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Retrieve all employment contracts across all employees (Centralized Repository).
        /// </summary>
        [Authorize(Policy = "Permissions.Users.View")]
        [ProducesResponseType(typeof(ApiResponseDTO<PaginationResponseDTO<EmploymentContractResponseDTO>>), 200)]
        [HttpGet("documents")]
        public async Task<IActionResult> GetAllEmployeeDocuments([FromQuery] PaginationDTO request, [FromQuery] string? search, [FromQuery] string? documentType, [FromQuery] bool? isArchived)
        {
            var result = await accountManagementService.GetAllEmployeeDocuments(request, search, documentType, isArchived);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("contracts")]
        public async Task<IActionResult> GetAllEmploymentContracts([FromQuery] PaginationDTO request, [FromQuery] string? search, [FromQuery] bool? isArchived)
        {
            var result = await accountManagementService.GetAllEmploymentContracts(request, search, isArchived);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Upload an employment contract to the repository.
        /// </summary>
        [Authorize(Policy = "Permissions.Users.Manage")]
        [ProducesResponseType(typeof(ApiResponseDTO<EmployeeAttachmentDTO>), 200)]
        [HttpPost("contracts/upload")]
        public async Task<IActionResult> UploadEmploymentContract([Required][FromQuery] string employeeNumber, [FromForm] UploadEmploymentContractDTO request, [FromServices] IActivityLogService activityLogService)
        {
            var result = await accountManagementService.UploadEmploymentContract(employeeNumber, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            var accountIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(accountIdStr, out Guid accountId))
            {
                await activityLogService.LogActivityAsync(accountId, "Create", $"Uploaded {request.ContractType} contract for Employee {employeeNumber}");
            }

            return Ok(result);
        }

        /// <summary>
        /// Updates an employee's statutory government records (SSS, PhilHealth, Pag-IBIG, TIN).
        /// Validates formats, encrypts at rest, and creates a sync record for FOMS.
        /// </summary>
        [Authorize(Policy = "Permissions.Users.Manage")]
        [HttpPut("update-statutory-records")]
        public async Task<IActionResult> UpdateStatutoryRecords([FromBody] UpdateStatutoryRecordsDTO request)
        {
            var result = await accountManagementService.UpdateStatutoryRecordsAsync(request);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Gets the sync history of statutory record transmissions to FOMS for a given employee.
        /// </summary>
        [Authorize(Policy = "Permissions.Users.View")]
        [HttpGet("{employeeNumber}/statutory-sync-records")]
        public async Task<IActionResult> GetStatutorySyncRecords(string employeeNumber)
        {
            var result = await accountManagementService.GetStatutorySyncRecordsAsync(employeeNumber);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }
    }
}
