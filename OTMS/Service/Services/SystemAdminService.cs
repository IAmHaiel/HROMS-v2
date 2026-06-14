using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NETCore.MailKit.Core;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System.Security.Cryptography;

namespace OTMS.Service.Services
{
    public class SystemAdminService(OTMSDbContext context, IConfiguration configuration, IEmailService emailService) : ISystemAdminService
    {
        public async System.Threading.Tasks.Task CheckSystemAdminExistence()
        {
            var exist = await context.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Role != null && a.Role.Name == "SystemAdmin");

            if (exist != null)
                throw new Exception("System Admin is already created.");

            return;
        }

        public async Task<ApiResponseDTO<object>> CreateSystemAdminAccount(SystemAdminCreationDTO request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                throw new Exception("Email or Password is invalid or empty.");

            var existing = await context.Employees
                .AnyAsync(e => e.EmployeeNumber == request.SystemAdminNumber);

            if (existing)
                throw new Exception("Employee Number is already existing, enter another Employee Number.");

            if (request.Password.Length < PasswordLength.MinimumLength ||
                request.Password.Length > PasswordLength.MaximumLength)
                throw new InvalidOperationException("Password must be at least 15 to 64 characters long.");

            var employee = new Employee
            {
                EmployeeId = Guid.NewGuid(),
                EmployeeNumber = request.SystemAdminNumber,
                FirstName = string.Empty,
                MiddleName = null,
                LastName = string.Empty,
                Suffix = null,
                ContactNumber = string.Empty,
                CreatedAt = DateTime.UtcNow,

                Email = request.Email,
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

            var systemAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "SystemAdmin");

            if (systemAdminRole == null)
            {
                throw new InvalidOperationException("SystemAdmin role is not seeded in the database.");
            }

            var account = new Account
            {
                AccountId = Guid.NewGuid(),
                EmployeeId = employee.EmployeeId,
                RoleId = systemAdminRole.RoleId,
                AccountStatus = "Pending Verification",
                CreatedAt = DateTime.UtcNow,
                IsPasswordChanged = false
            };

            account.PasswordHash = new PasswordHasher<Account>().HashPassword(account, request.Password);
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
                            Hello, System Admin!

                            Welcome to the Operational Management System.

                            The Registered Employee Number you entered for logging in is: {request.SystemAdminNumber}

                            Please verify your System Admin account by clicking the link below:

                            {verificationLink}

                            After verifying your account, we recommend changing your password and details immediately after logging in.
                            """
                );

            return new ApiResponseDTO<object>
            {
                IsSuccess = true,
                Message = $"Email Verification sent to {request.Email}. Please check you inbox.",
                Data = null
            };

        }
    }
}
