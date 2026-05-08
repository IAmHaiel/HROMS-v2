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
    }
}
