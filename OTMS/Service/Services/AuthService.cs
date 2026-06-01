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

            if (accountStatus is null || accountStatus == "Deactivated" || accountFailedAttempts == MaxFailedLoginAttempts)
            {
                return null;
            }

            if (accountStatus == "On Leave")
            {
                var hasEmergencyOverride = await context.EmergencyOverrideRequests
                    .AnyAsync(e =>
                        e.RequestedById == employee.Account.AccountId &&
                        e.Status == "Approved" &&
                        e.OverrideUntil > DateTime.UtcNow);

                if (!hasEmergencyOverride)
                {
                    // Get the active leave for this employee
                    var activeLeave = await context.LeaveRequests
                        .FirstOrDefaultAsync(lr =>
                            lr.AccountId == employee.Account.AccountId &&
                            lr.Approval_Status == "Approved");

                    // Generate limited override token
                    var overrideToken = CreateOverrideToken(employee);

                    throw new OnLeaveException(
                        overrideToken,
                        activeLeave?.LeaveId ?? Guid.Empty,
                        employee.EmployeeName ?? string.Empty
                    );
                }

                employee.Account.AccountStatus = "Emergency Overriden";
                await context.SaveChangesAsync();
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
                        employee.Account.AccountStatus = "Deactivated";

                    context.Accounts.Update(employee.Account);
                    await context.SaveChangesAsync();
                }
                return null;
            }
            
            if (employee.Account.AccountStatus == "Deactivated")
            {
                return null;
            }

            // Save Login Activity
            await activityLogService.LogActivityAsync(
                employee.Account.AccountId,
                ActivityTypes.Login,
                $"{employee.EmployeeName} timed in at {DateTime.Now:hh:mm tt}"
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
                throw new InvalidOperationException("Generated password must be at least 15 characters long.");

            var employee = new Employee
            {
                EmployeeId = Guid.NewGuid(),
                EmployeeNumber = request.EmployeeNumber,
                EmployeeName = request.EmployeeName.Trim(),
                ContactNumber = request.ContactNumber.Trim(),
                CreatedAt = DateTime.UtcNow,

                Email = request.Email.Trim(),
                IsEmailVerified = false,

                EmailVerificationToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)),
                EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24)
            };

            var account = new Account
            {
                AccountId = Guid.NewGuid(),
                EmployeeId = employee.EmployeeId,
                Role = request.Role.Trim(),
                AccountStatus = "Active",
                CreatedAt = DateTime.UtcNow,
                IsPasswordChanged = false
            };

            account.PasswordHash = new PasswordHasher<Account>().HashPassword(account, generatedUserPassword);
            employee.Account = account;

            context.Employees.Add(employee);
            context.Accounts.Add(account);
            await context.SaveChangesAsync();

            var verificationLink =
                $"{configuration["ApiBaseUrl"]}/verify-email" + 
                $"?token={Uri.EscapeDataString(employee.EmailVerificationToken!)}";

            // Sending email verification notification
            await emailService.SendAsync(
                        employee.Email,
                        "Verify your Operational Management System Account",
                        $"Click the link below to verify your account:\n\n{verificationLink}"
                );

            return new EmployeeRegisterResponseDTO
            {
                EmployeeNumber = employee.EmployeeNumber,
                EmployeeName = employee.EmployeeName ?? string.Empty,
                ContactNumber = employee.ContactNumber ?? string.Empty,
                Role = account.Role ?? string.Empty,
                GeneratedPassword = generatedUserPassword
            };
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
                RefreshToken = await GenerateAndSaveRefreshTokenAsync(employee),
                Role = employee.Account.Role ?? string.Empty,
                EmployeeName = employee.EmployeeName ?? string.Empty,
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

        private string GeneratePassword()
        {
            const string chars =
                "SpeedexEmployee2026";

            var random = new Random();

            return new string(
                Enumerable.Repeat(chars, 10)
                    .Select(x => x[random.Next(x.Length)])
                    .ToArray()
            );
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

        private string CreateOverrideToken(Employee employee)
        {
            var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, employee.Account!.AccountId.ToString()),
        new Claim(ClaimTypes.Name, employee.EmployeeNumber),
        new Claim("token_type", "emergency_override"),  // ← scoped claim
    };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(configuration.GetValue<string>("AppSettings:Token")!));

            var tokenDescriptor = new JwtSecurityToken(
                issuer: configuration.GetValue<string>("AppSettings:Issuer"),
                audience: configuration.GetValue<string>("AppSettings:Audience"),
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),  // ← short expiry
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha512)
            );

            return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
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
    }
}