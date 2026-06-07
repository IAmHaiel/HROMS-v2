using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NETCore.MailKit.Core;
using OTMS.Common;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.ActivityLogs.Responses;
using OTMS.Entities.DTOs.PasswordVerification;
using OTMS.Entities.DTOs.PasswordVerification.Response;
using OTMS.Entities.DTOs.ResetPassword;
using OTMS.Entities.Models;
using OTMS.Service.Helper;
using OTMS.Service.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace OTMS.Service.Services
{
    public class AuthService(IActivityLogService activityLogService, IConfiguration configuration, OTMSDbContext context, INotificationService notificationService, IEmailService emailService) : IAuthService
    {
        static int MaxFailedLoginAttempts = 3;
        static string? GeneratedPassword = String.Empty;

        public async Task<TokenResponseDTO?> LoginAsync(
            EmployeeLoginDTO request
        )
        {

            var employee = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(
                    u => u.EmployeeNumber == request.EmployeeNumber
                );

            var accountStatus = employee?.Account?.AccountStatus;
            var accountFailedAttempts = employee?.Account?.FailedLoginAttempts;



            if (employee is null || employee.Account is null || string.IsNullOrEmpty(employee.Account.PasswordHash))
            {
                return null;
            }

            if (!employee.IsEmailVerified)
            {
                throw new ArgumentException(
                    "Please verify your email before logging in. If you haven't received the verification email, please check your spam folder or contact support."
                );
            }

            if (accountStatus is null || accountStatus == "Deactivated" || accountStatus == "Locked" || accountFailedAttempts == MaxFailedLoginAttempts)
            {
                return null;
            }

            if (accountStatus == "On Leave")
            {
                var activeLeave = await context.LeaveRequests
                    .FirstOrDefaultAsync(lr =>
                        lr.AccountId == employee.Account.AccountId &&
                        lr.Approval_Status == "Approved");

                throw new OnLeaveException(
                    employee.Account?.AccountId ?? Guid.Empty
                    , activeLeave?.LeaveId ?? Guid.Empty
                    , string.Join(" ", new[]
                        {
                            employee.FirstName ?? string.Empty,
                            employee.MiddleName ?? string.Empty,
                            employee.LastName ?? string.Empty,
                            employee.Suffix ?? string.Empty
                        }.Where(x => !string.IsNullOrWhiteSpace(x))));
            }

            var verificationResult =
                new PasswordHasher<Account>()
                    .VerifyHashedPassword(
                        employee.Account,
                        employee.Account.PasswordHash,
                        request.Password
                    );

            // If the Password is incorrect, return null to indicate failed login
            if (verificationResult == PasswordVerificationResult.Failed)
            {
                if (employee.Account.Role != "SystemAdmin")
                {
                    employee.Account.FailedLoginAttempts++;

                    if (employee.Account.FailedLoginAttempts >= MaxFailedLoginAttempts)
                        employee.Account.AccountStatus = "Locked";

                    context.Accounts.Update(employee.Account);
                    await context.SaveChangesAsync();
                }
                return null;
            }
            
            if (employee.Account.AccountStatus == "Deactivated" || employee.Account.AccountStatus == "Locked")
            {
                return null;
            }

            if (accountStatus == "Emergency Overriden")
            {
                // Save Login Activity
                await activityLogService.LogActivityAsync(
                    employee.Account.AccountId,
                    ActivityTypes.Login,
                    $"[Emergency Overriden] {string.Join(" ", new[]
                        {employee.FirstName, employee.MiddleName, employee.LastName, employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} timed in at {DateTime.Now:hh:mm tt}"
                    );

                employee.Account.FailedLoginAttempts = 0;
                await context.SaveChangesAsync();

                // Check Task Deadlines
                await notificationService.CheckTaskDeadlinesAsync();

                return await CreateTokenResponse(employee);
            }

            // Save Login Activity
            await activityLogService.LogActivityAsync(
                employee.Account.AccountId,
                ActivityTypes.Login,
                $"{string.Join(" ", new[]
                    {employee.FirstName, employee.MiddleName, employee.LastName, employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} timed in at {DateTime.Now:hh:mm tt}"
                );

            employee.Account.FailedLoginAttempts = 0;
            await context.SaveChangesAsync();

            // Check Task Deadlines
            await notificationService.CheckTaskDeadlinesAsync();

            return await CreateTokenResponse(employee);
        }

        public async Task<TokenResponseDTO?> RefreshTokensAsync(
            RefreshTokenRequestDTO request
        )
        {
            var user = await ValidateRefreshTokenAsync(
                request.AccountId,
                request.RefreshToken
            );

            if (user is null)
            {
                return null;
            }

            ActivityLogResponseDTO activity = new ActivityLogResponseDTO();

            return await CreateTokenResponse(user);
        }

        public async Task<EmployeeRegisterResponseDTO?> RegisterAsync(EmployeeRegisterDTO request)
        {
            if (string.IsNullOrWhiteSpace(request.EmployeeNumber))
                return null;

            request.EmployeeNumber = request.EmployeeNumber.ToUpper().Trim();
            request.ContactNumber = ContactNumberFormatter(request.ContactNumber); // only once

            var exists = await context.Employees.AnyAsync(u => u.EmployeeNumber == request.EmployeeNumber);
            if (exists)
                throw new InvalidOperationException("Employee Number already exists.");

            var generatedUserPassword = PasswordGenerator.Generate(); // one password only

            if (generatedUserPassword.Length < PasswordLength.MinimumLength ||
                generatedUserPassword.Length > PasswordLength.MaximumLength)
                throw new InvalidOperationException("Generated password must be at least 15 to 64 characters long.");

            GeneratedPassword = generatedUserPassword; // assign to static variable for email use

            var employee = new Employee
            {
                EmployeeId = Guid.NewGuid(),
                EmployeeNumber = request.EmployeeNumber,
                FirstName = request.FirstName.Trim(),
                MiddleName = string.IsNullOrWhiteSpace(request.MiddleName) ? null : request.MiddleName,
                LastName = request.LastName.Trim(),
                Suffix = string.IsNullOrWhiteSpace(request.Suffix) ? null : request.Suffix,
                ContactNumber = request.ContactNumber.Trim(),
                CreatedAt = DateTime.UtcNow,

                Email = request.Email.Trim(),
                IsEmailVerified = false,

                // Based on OWASP "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/09-Testing_for_Weak_Password_Change_or_Reset_Functionalities"
                /*
                    1. Cryptographically Secure Pseudo-Random Number Generator (CSPRNG) is included in .NET's RandomNumberGenerator class, which provides a secure way to generate random data.

                    2. 16 Bytes = 32 hex digits/characters long.

                    3. 1 hour is recommended to minimize the window of opportunity for attackers while still giving users enough time to verify their email.
                 */
                EmailVerificationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)),
                EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(1)
            };

            var account = new Account
            {
                AccountId = Guid.NewGuid(),
                EmployeeId = employee.EmployeeId,
                Role = request.Role.Trim(),
                AccountStatus = "Pending Verification",
                CreatedAt = DateTime.UtcNow,
                IsPasswordChanged = false
            };

            account.PasswordHash = new PasswordHasher<Account>().HashPassword(account, generatedUserPassword);
            employee.Account = account;

            context.Employees.Add(employee);
            context.Accounts.Add(account);
            await context.SaveChangesAsync();

            var verificationLink =
                $"{configuration["FrontendBaseUrl"]}/verify-email" +
                $"?token={employee.EmailVerificationToken}";

            // Sending email verification notification
            await emailService.SendAsync(
                        employee.Email,
                            "Verify your Operational Management System Account",
                            $"""
                            Welcome to the Operational Management System.

                            Your login credentials are:

                            Employee Number: {employee.EmployeeNumber}
                            Password: {GeneratedPassword}

                            Please verify your account by clicking the link below:

                            {verificationLink}

                            After verifying your account, we recommend changing your password immediately after logging in.
                            """
                );

            return new EmployeeRegisterResponseDTO
            {
                EmployeeNumber = employee.EmployeeNumber,
                FirstName = employee.FirstName ?? string.Empty,
                MiddleName = employee.MiddleName ?? null,
                LastName = employee.LastName ?? string.Empty,
                Suffix = employee.Suffix ?? null,
                ContactNumber = employee.ContactNumber ?? string.Empty,
                Role = account.Role ?? string.Empty,
                GeneratedPassword = generatedUserPassword
            };
        }

        public async System.Threading.Tasks.Task ResendVerificationAsync(string employeeNumber)
        {
            var employee = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.EmployeeNumber == employeeNumber);

            if (employee == null)
            {
                throw new KeyNotFoundException("Employee not found.");
            }

            employee.EmailVerificationToken =
            Convert.ToHexString(RandomNumberGenerator.GetBytes(16));

            employee.EmailVerificationTokenExpiry =
                DateTime.UtcNow.AddHours(1);

            await context.SaveChangesAsync();

            var verificationLink =
                $"{configuration["ApiBaseUrl"]}/api/authentication/verify-email" +
                $"?token={employee.EmailVerificationToken}";

            await emailService.SendAsync(
                employee.Email,
                    "Verify your Operational Management System Account",
                    $"""
                    Welcome to the Operational Management System.

                    Your login credentials are:

                    Employee Number: {employee.EmployeeNumber}
                    Password: {GeneratedPassword}

                    Please verify your account by clicking the link below:

                    {verificationLink}

                    After verifying your account, we recommend changing your password immediately after logging in.
                    """
            );
        }

        public async Task<PasswordVerificationResponseDTO> VerifyPasswordAsync(PasswordVerificationDTO request)
        {
            var employee = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.EmployeeNumber == request.EmployeeID);

            if (employee == null || employee.Account == null)
                return new PasswordVerificationResponseDTO
                {
                    isSuccess = false,
                    Message = "Employee or account not found."
                };

            var verificationResult = new PasswordHasher<Account>()
                .VerifyHashedPassword(
                    employee.Account
                    , employee.Account.PasswordHash
                    , request.Password);

            if (verificationResult == PasswordVerificationResult.Success)
                {
                return new PasswordVerificationResponseDTO
                {
                    isSuccess = true,
                    Message = "Password is correct."
                };
            }
            else
            {
                return new PasswordVerificationResponseDTO
                {
                    isSuccess = false,
                    Message = "Incorrect password."
                };
            }
        }

        // ─── Helper Methods ────────────────────────────────────────────────

        private static string ContactNumberFormatter(string contactNumber)
        {
            if (string.IsNullOrEmpty(contactNumber))
            {
                return contactNumber;
            }

            // Ensuring only digits
            contactNumber = new string(contactNumber.Where(char.IsDigit).ToArray());

            // Validate the length
            if (contactNumber.Length != 11 || !contactNumber.StartsWith("09"))
            {
                throw new Exception("Contact Number must be exactly 11 digits and start with 09.");
            }

            // Philippines Contact Number Format: 09XX XXX XXXX
            return $"{contactNumber[..4]} {contactNumber.Substring(4, 3)} {contactNumber.Substring(7, 4)}";
        }

        private async Task<TokenResponseDTO> CreateTokenResponse(Employee employee)
        {

            if (employee.Account is null)
            {
                throw new InvalidOperationException(
                    "Employee does not have an associated account."
                );
            }

            return new TokenResponseDTO
            {
                AccessToken = CreateToken(employee),
                EmployeeNumber = employee.EmployeeNumber,
                RefreshToken = await GenerateAndSaveRefreshTokenAsync(employee),
                Role = employee.Account.Role ?? string.Empty,
                FirstName = employee.FirstName ?? string.Empty,
                MiddleName = employee.MiddleName ?? null,
                LastName = employee.LastName ?? string.Empty,
                Suffix = employee.Suffix ?? null,
                IsPasswordChanged = employee.Account.IsPasswordChanged
            };
        }

        private async Task<string> GenerateAndSaveRefreshTokenAsync(
            Employee employee
        )
        {

            if (employee.Account is null)
            {
                throw new InvalidOperationException(
                    "Employee does not have an associated account."
                );
            }

            var refreshToken = GenerateRefreshToken();

            employee.Account.RefreshToken = refreshToken;
            employee.Account.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            await context.SaveChangesAsync();

            return refreshToken;
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];

            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);

            return Convert.ToBase64String(randomNumber);
        }

        private string CreateToken(Employee employee)
        {

            if (employee.Account is null)
            {
                throw new InvalidOperationException(
                    "Employee does not have an associated account."
                );
            }

            var claims = new List<Claim>
            {
                new Claim(
                    ClaimTypes.Name,
                    employee.EmployeeNumber
                ),
                new Claim(
                    ClaimTypes.NameIdentifier,
                    employee.Account.AccountId.ToString()
                ),
                new Claim(
                    ClaimTypes.Role,
                    (employee.Account.Role ?? string.Empty).Replace(" ", "")
                )
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    configuration.GetValue<string>(
                        "AppSettings:Token"
                    )!
                )
            );

            var creds = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha512
            );

            var tokenDescriptor = new JwtSecurityToken(
                issuer: configuration.GetValue<string>(
                    "AppSettings:Issuer"
                ),
                audience: configuration.GetValue<string>(
                    "AppSettings:Audience"
                ),
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler()
                .WriteToken(tokenDescriptor);
        }

        private async Task<Employee?> ValidateRefreshTokenAsync(
            Guid userId,
            string refreshToken
        )
        {
            var user = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.Account != null && e.Account.AccountId == userId);

            if (user is null || user.Account is null)
            {
                return null;
            }

            if (
                user is null ||
                user.Account.RefreshToken != refreshToken ||
                user.Account.RefreshTokenExpiryTime <= DateTime.UtcNow
            )
            {
                return null;
            }

            return user;
        }

        public async Task<ApiResponseDTO<object>> ForgotPasswordAsync(ForgotPasswordDTO request)
        {
            var employee = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.Email == request.Email);

            if (employee == null || employee.Account == null)
                throw new Exception("Employee or Account is not Found.");

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(16));

            employee.Account.PasswordResetToken = token;
            employee.Account.PasswordResetTokenExpiryTime = DateTime.UtcNow.AddMinutes(15); // Based on https://www.authgear.com/post/authentication-security-password-reset-best-practices-and-more/#:~:text=How%20long%20should%20a%20password,immediately%20after%20a%20successful%20reset.
            
            await context.SaveChangesAsync();

            var resetLink = $"{configuration["FrontendBaseUrl"]}/reset-password?token={token}";

            await emailService.SendAsync(
                        employee.Email,
                            "Change Password for Operational Management System Account",
                            $"""
                            Welcome {string.Join(" ", new[]
                                {employee.FirstName, employee.MiddleName, employee.LastName, employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} to the Operational Management System.

                            Please click the link below to reset your password, the link last 15 minutes:

                            {resetLink}
                            """
                );

            return new ApiResponseDTO<object>
            {
                IsSuccess = true,
                Message = "Password reset link has been sent to your email.",
                Data = null
            };
        }

        public async Task<ApiResponseDTO<object>> ResetPasswordAsync(ResetPasswordDTO request)
        {

            var account = await context.Accounts
                .FirstOrDefaultAsync(a =>
                    a.PasswordResetToken == request.Token
                    && a.PasswordResetTokenExpiryTime > DateTime.UtcNow);

            if (account == null)
                throw new Exception("Invalid or expired password reset token.");

            if(request.NewPassword.Length < PasswordLength.MinimumLength ||
                request.NewPassword.Length > PasswordLength.MaximumLength)
                throw new Exception("New password must be at least 15 to 64 characters long.");

            var passwordHasher = new PasswordHasher<Account>();
            account.PasswordHash = passwordHasher.HashPassword(account, request.NewPassword);

            account.PasswordResetToken = null;
            account.PasswordResetTokenExpiryTime = null;

            await context.SaveChangesAsync();

            return new ApiResponseDTO<object>
            {
                IsSuccess = true,
                Message = "Password has been reset successfully.",
                Data = null
            };

        }
    }
}