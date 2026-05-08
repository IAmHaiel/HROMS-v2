using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.AccountManagement;
using OTMS.Entities.DTOs.AccountManagement.Responses;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class AccountManagementService(
        OTMSDbContext context
        ) : IAccountManagementService
    {

        static string SystemAdminNumber = "SPDX-SPR-01";

        public async Task<ActivateUserResponseDTO?> ActivateUser(DeactivateUserDTO request)
        {
            var exist = context.Employees
                .Include(e => e.Account)
                .FirstOrDefault(e => e.EmployeeNumber == request.EmployeeNumber);

            if (exist is null || exist.Account is null)
            {
                return null;
            }

            var systemAdminAccount = exist.Account.Role;

            if (systemAdminAccount is not null && systemAdminAccount == "SystemAdmin")
            {
                throw new InvalidOperationException("Cannot modify the System Admin account.");
            }

            var accountStatus = exist.Account.AccountStatus;

            if (accountStatus == "Active")
            {
                throw new InvalidOperationException("Account is already active.");
            }

            await context.Employees
                .Where(e => e.EmployeeId == exist.EmployeeId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.UpdatedAt, DateTime.UtcNow));

            await context.Accounts
                .Where(e => e.EmployeeId == exist.EmployeeId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.AccountStatus, "Active")
                    .SetProperty(e => e.UpdatedAt, DateTime.UtcNow)
                    .SetProperty(e => e.FailedLoginAttempts, 0));

            return new ActivateUserResponseDTO
            {
                EmployeeNumber = exist.EmployeeNumber,
                Success = true,
                ActivatedAt = DateTime.UtcNow
            };
        }

        public async Task<AssignUserRoleResponseDTO?> AssignUserRole(AssignUserRoleDTO request)
        {
            // Get employee by employee number
            // Get account by employee id
            // Check if it both exists
            // Check if the account belongs to a System Admin and prevent role change if it does
            // Check if the role is already the same as the requested role
            // Update the account role
            // Return response DTO with success status and assigned role

            var exist = context.Employees
                .Include(e => e.Account)
                .FirstOrDefault(e => e.EmployeeNumber == request.EmployeeNumber);
            
            if (exist is null || exist.Account is null)
            {
                throw new InvalidOperationException("Employee or account not found.");
            }

            if (exist.EmployeeNumber == SystemAdminNumber)
            {
                throw new InvalidOperationException("Cannot modify the role of a this System Admin account.");
            }

            if (exist.Account.Role == request.RoleName)
            {
                throw new InvalidOperationException("The account already has the specified role.");
            }

            await context.Accounts
                .Where(e => e.EmployeeId == exist.EmployeeId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.Role, request.RoleName)
                    .SetProperty(e => e.UpdatedAt, DateTime.UtcNow));

            return new AssignUserRoleResponseDTO
            {
                EmployeeNumber = exist.EmployeeNumber,
                RoleName = request.RoleName,
                Success = true,
                AssignedAt = DateTime.UtcNow
            };
        }

        public async Task<DeactivateUserResponseDTO?> DeactivateUser(DeactivateUserDTO request)
        {
            // Get the employee by employee number
            var exist = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.EmployeeNumber == request.EmployeeNumber);

            // Check if the employee exists
            if (exist is null || exist.Account is null)
            {
                return null;
            }

            // Prevent deactivation of System Admin accounts
            var systemAdminAccount = exist.Account.Role;
            
            if (systemAdminAccount is not null && systemAdminAccount == "SystemAdmin")
            {
                throw new InvalidOperationException("Cannot deactivate a System Admin account.");
            }


            // Account status check to prevent deactivation
            var accountStatus = exist.Account.AccountStatus;

            if(accountStatus == "Deactivated")
            {
                throw new InvalidOperationException("Account is already deactivated.");
            }


            // Deactivate the employee's account
            await context.Employees
                .Where(e => e.EmployeeId == exist.EmployeeId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.UpdatedAt, DateTime.UtcNow));

            await context.Accounts
                .Where(e => e.EmployeeId == exist.EmployeeId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.AccountStatus, "Deactivated")
                    .SetProperty(e => e.UpdatedAt, DateTime.UtcNow));

            return new DeactivateUserResponseDTO
            {
                EmployeeNumber = exist.EmployeeNumber,
                Success = true,
                DeactivatedAt = DateTime.UtcNow
            };
        }

        public async Task<DeleteUserResponseDTO?> DeleteUser(DeactivateUserDTO request)
        {
            // Get the employee by employee number
            var exist = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.EmployeeNumber == request.EmployeeNumber);

            // Check if the employee exists
            if (exist is null || exist.Account is null)
            {
                return null;
            }

            // Check if the account belongs to a System Admin and prevent deletion if it does
            var systemAdminAccount = exist.Account.Role;

            if (systemAdminAccount is not null && systemAdminAccount == "SystemAdmin")
            {
                throw new InvalidOperationException("Cannot delete a System Admin account.");
            }

            // Delete the employee's account
            context.Employees.Remove(exist);
            await context.SaveChangesAsync();

            return new DeleteUserResponseDTO
            {
                EmployeeNumber = exist.EmployeeNumber,
                Success = true,
                DeletedAt = DateTime.UtcNow
            };
        }

        public async Task<List<RecentEmployeesResponseDTO>> GetRecentEmployees()
        {
            return await context.Employees
                .Include(e => e.Account)
                .OrderByDescending(e => e.CreatedAt)
                .Take(10)
                .Select(e => new RecentEmployeesResponseDTO
                {
                    EmployeeNumber = e.EmployeeNumber,
                    EmployeeName = e.EmployeeName,
                    ContactNumber = e.ContactNumber,
                    Role = e.Account != null ? e.Account.Role : "No Account",
                    AccountStatus = e.Account != null ? e.Account.AccountStatus : "No Account",
                })
                .ToListAsync();
        }

        public async Task<SearchUserResponseDTO?> SearchUser(SearchUserDTO request)
        {
            var employee = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e =>
                    e.EmployeeName.Contains(request.Search) ||
                    e.EmployeeNumber.Contains(request.Search) ||
                    e.Account.Role.Contains(request.Search)
                    );

            if (employee is null || employee.Account is null)
            {
                return null;
            }

            return new SearchUserResponseDTO
            {
                EmployeeNumber = employee.EmployeeNumber,
                EmployeeName = employee.EmployeeName,
                Role = employee.Account.Role,
                AccountStatus = employee.Account.AccountStatus,
                Success = true
            };

        }

        public async Task<UpdateEmployeeResponseDTO?> UpdateEmployee(string employeeNumber, UpdateEmployeeDTO request)
        {
            var employee = await context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeNumber == employeeNumber);

            if (employee == null) return null;

            if (request.EmployeeNumber == "string" || String.IsNullOrEmpty(request.EmployeeNumber))
            {
                request.EmployeeNumber = employee.EmployeeNumber;
            }

            if (request.EmployeeName == "string" || String.IsNullOrEmpty(request.EmployeeName))
            {
                request.EmployeeName = employee.EmployeeName;
            }

            if (request.ContactNumber == "string" || String.IsNullOrEmpty(request.ContactNumber))
            {
                request.ContactNumber = employee.ContactNumber;
            }

            await context.Employees
                .Where(e => e.EmployeeId == employee.EmployeeId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.EmployeeNumber, request.EmployeeNumber)
                    .SetProperty(e => e.EmployeeName, request.EmployeeName)
                    .SetProperty(e => e.ContactNumber, request.ContactNumber)
                    .SetProperty(e => e.UpdatedAt, DateTime.UtcNow));

            return new UpdateEmployeeResponseDTO
            {
                EmployeeNumber = request.EmployeeNumber,
                EmployeeName = request.EmployeeName ?? employee.EmployeeName,
                ContactNumber = request.ContactNumber ?? employee.ContactNumber,
                Success = true
            };
        }

    }
}
