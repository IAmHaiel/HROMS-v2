using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NETCore.MailKit.Core;
using OTMS.Common;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System.Security.Claims;
using System.Security.Cryptography;

namespace OTMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class authenticationController(OTMSDbContext context, IAuthService authService, ILeaveRequest lrService, IActivityLogService activitylogService, IEmployeeService employeeService, IConfiguration configuration, IEmailService emailService) : ControllerBase
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
            var employee = await employeeService.GetEmployeeByEmployeeNumberAsync(request.EmployeeNumber);

            if (employee is null || employee.Account is null)
                return Unauthorized(new { message = "Invalid Employee ID or password." });

            if (employee.Account.AccountStatus == "Deactivated")
            {
                if (employee.Account.FailedLoginAttempts >= 3)
                    return Unauthorized(new
                    {
                        message = "Your account has been locked due to 3 consecutive failed login attempts. Please contact your administrator.",
                        employeeName = employee.EmployeeName
                    });

                return Unauthorized(new
                {
                    message = "Your account has been deactivated by the System Administrator. Please contact your administrator.",
                    employeeName = employee.EmployeeName
                });
            }

            bool isOnLeave = employee.Account.AccountStatus == "On Leave";

            try
            {
                if (!isOnLeave)                                                          
                    await lrService.UpdateEmployeeAvailabilityStatusesAsync(employee.Account.AccountId);

                var result = await authService.LoginAsync(request);
                if (result is null)
                    return Unauthorized(new { message = "Invalid Employee ID or password." });

                return Ok(result);
            }
            catch (OnLeaveException ex)
            {
                return Unauthorized(new
                {
                    message = "Your account is currently on leave and cannot be accessed.",
                    employeeName = ex.EmployeeName,
                    accountId = ex.AccountId, 
                    leaveId = ex.LeaveId           
                });
            }
            
        }

        /// <summary>
        /// Logouts the authentication user.
        /// </summary>
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var accountIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(accountIdClaim))
                return Unauthorized();

            var accountId = Guid.Parse(accountIdClaim);
            var account = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == accountId);

            if (account == null)
                return NotFound();

            // Remove the Refresh Tokens
            account.RefreshToken = null;
            account.RefreshTokenExpiryTime = null;

            await context.SaveChangesAsync();

            // Save Logout Activity
            await activitylogService.LogActivityAsync(
                accountId,
                ActivityTypes.Logout,
                $"{account.Employee.EmployeeName} timed out at {DateTime.Now:hh:mm tt}");

            return Ok(new {message = "Logged out successfully."});
        }

        /// <summary>
        /// Uses the Refresh Token to generate a new Access Token for Authentication.
        /// </summary>
        /// <param name="request">User credentials.</param>
        /// <response code="200">Refresh Token successful. Access token and Refresh Token returned.</response>
        /// <response code="401">Invalid request payload or missing fields.</response>
        /// <response code="500">Unexpected server error.</response>
        [Authorize]
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

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail(string token)
        {
            Console.WriteLine($"Received: [{token}]");

            var account = await context.Employees
                .FirstOrDefaultAsync
                    (e => e.EmailVerificationToken == token);

            if (account == null)
            {
                return BadRequest("Invalid token.");
            }

            if (account.EmailVerificationTokenExpiry < DateTime.UtcNow)
            {
                return BadRequest("Token expired.");
            }

            account.IsEmailVerified = true;
            account.EmailVerificationToken = null;
            account.EmailVerificationTokenExpiry = null;

            await context.SaveChangesAsync();

            return Ok("Email verified successfully.");
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification(string employeeNumber)
        {
            try
            {
                await authService.ResendVerificationAsync(employeeNumber);
                return Ok("Verification email resent successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

    }
}