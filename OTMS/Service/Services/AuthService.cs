using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.Models;
using OTMS.Service.Helper;
using OTMS.Service.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace OTMS.Service.Services
{
    public class AuthService(
        OTMSDbContext context,
        IConfiguration configuration
    ) : IAuthService
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
                throw new UnauthorizedAccessException("Account is deactivated. Please contact the administrator.");
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

                var Account = await context.Accounts
                    .FirstOrDefaultAsync(
                        a => a.EmployeeId == employee.EmployeeId
                    );

                if (Account is not null && Account.Role != "SystemAdmin")
                {
                    Account.FailedLoginAttempts++;
                    context.Accounts.Update(Account);
                    await context.SaveChangesAsync();
                    
                    if(Account.FailedLoginAttempts >= MaxFailedLoginAttempts)
                    {
                        Account.AccountStatus = "Deactivated";
                        context.Accounts.Update(Account);
                        await context.SaveChangesAsync();
                    }

                    return null;
                }

                return null;
            }

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

            return await CreateTokenResponse(user);
        }

        public async Task<EmployeeRegisterResponseDTO?> RegisterAsync(
            EmployeeRegisterDTO request
        )
        {
            if (string.IsNullOrWhiteSpace(request.EmployeeNumber))
            {
                return null;
            }

            // Normalize the Employee Number to ensure consistent checks (e.g., uppercase and trim)
            request.EmployeeNumber = request.EmployeeNumber.ToUpper().Trim();

            // Check if the Contact Number is valid and format it
            request.ContactNumber = ContactNumberFormatter(request.ContactNumber);

            var exists = await context.Employees.AnyAsync(
                u => u.EmployeeNumber == request.EmployeeNumber
            );

            if (exists)
            {
                throw new InvalidOperationException("Employee Number already exists. Please choose a different one.");
            }

            var generatedPassword = GeneratePassword();

            var employee = new Employee
            {
                EmployeeId = Guid.NewGuid(),
                EmployeeNumber = request.EmployeeNumber.Trim(),
                EmployeeName = request.EmployeeName.Trim(),
                ContactNumber = request.ContactNumber.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            var account = new Account
            {
                AccountId = Guid.NewGuid(),
                EmployeeId = employee.EmployeeId, // FK
                Role = request.Role.Trim(),
                AccountStatus = "Active",
                CreatedAt = DateTime.UtcNow
            };

            var passwordHasher = new PasswordHasher<Account>();

            var generatedUserPassword = PasswordGenerator.Generate();

            account.PasswordHash = passwordHasher.HashPassword(
                account,
                generatedUserPassword
            );

            employee.Account = account;

            context.Employees.Add(employee);
            context.Accounts.Add(account);
            await context.SaveChangesAsync();

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
            if(string.IsNullOrEmpty(contactNumber))
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
                Role = employee.Account.Role ?? string.Empty
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
                    employee.Account.Role ?? string.Empty
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
    }
}