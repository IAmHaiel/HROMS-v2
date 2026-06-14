using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.AccountManagement;
using OTMS.Entities.DTOs.AccountManagement.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;
using OTMS.Entities.Models;
using OTMS.Service.Helper;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class AccountManagementService(
        OTMSDbContext context,
        IFileService fileService
        ) : IAccountManagementService
    {

        static string SystemAdminNumber = "SPDX-SPR-01";

        public async Task<ActivateUserResponseDTO?> ActivateUser(DeactivateUserDTO request)
        {
            var exist = context.Employees
                .Include(e => e.Account)
                    .ThenInclude(a => a.Role)
                .FirstOrDefault(e => e.EmployeeNumber == request.EmployeeNumber);

            if (exist is null || exist.Account is null)
            {
                return null;
            }

            var systemAdminAccount = exist.Account.Role?.Name;

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
                    .ThenInclude(a => a.Role)
                .FirstOrDefault(e => e.EmployeeNumber == request.EmployeeNumber);

            if (exist is null || exist.Account is null)
            {
                throw new InvalidOperationException("Employee or account not found.");
            }

            if (exist.EmployeeNumber == SystemAdminNumber)
            {
                throw new InvalidOperationException("Cannot modify the role of a this System Admin account.");
            }

            var newRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == request.RoleName);
            if (newRole == null)
            {
                throw new InvalidOperationException("The requested role does not exist.");
            }

            if (exist.Account.Role?.Name == request.RoleName)
            {
                throw new InvalidOperationException("The account already has the specified role.");
            }

            await context.Accounts
                .Where(e => e.EmployeeId == exist.EmployeeId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.RoleId, newRole.RoleId)
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
                    .ThenInclude(a => a.Role)
                .FirstOrDefaultAsync(e => e.EmployeeNumber == request.EmployeeNumber);

            // Check if the employee exists
            if (exist is null || exist.Account is null)
            {
                return null;
            }

            // Prevent deactivation of System Admin accounts
            var systemAdminAccount = exist.Account.Role?.Name;

            if (string.IsNullOrEmpty(systemAdminAccount) || systemAdminAccount == Common.Constraints.Roles.SystemAdmin)
            {
                throw new InvalidOperationException("Cannot deactivate a System Admin account.");
            }


            // Account status check to prevent deactivation
            var accountStatus = exist.Account.AccountStatus;

            if (accountStatus == "Deactivated")
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
                    .ThenInclude(a => a.Role)
                .FirstOrDefaultAsync(e => e.EmployeeNumber == request.EmployeeNumber);

            // Check if the employee exists
            if (exist is null || exist.Account is null)
            {
                return null;
            }

            // Check if the account belongs to a System Admin and prevent deletion if it does
            var systemAdminAccount = exist.Account.Role?.Name;

            if (string.IsNullOrEmpty(systemAdminAccount) || systemAdminAccount == Common.Constraints.Roles.SystemAdmin)
            {
                throw new InvalidOperationException("Cannot delete a System Admin account.");
            }

            // Soft Delete the employee's account
            exist.Account.AccountStatus = "Deleted";

            // Save changes to database
            await context.SaveChangesAsync();

            return new DeleteUserResponseDTO
            {
                EmployeeNumber = exist.EmployeeNumber,
                Success = true,
                DeletedAt = DateTime.UtcNow
            };
        }

        public async Task<PaginationResponseDTO<SearchAccountStatusResponseDTO>> GetAccountsByStatus(SearchAccountStatusDTO request)
        {
            var query = context.Employees
                .Include(e => e.Account)
                    .ThenInclude(a => a.ActivityLogs)
                .Include(e => e.Attachments)
                .Where(e => e.Account != null &&
                            e.Account.AccountStatus == request.Status);

            var totalEmployees = await query.CountAsync();

            var employees = await query
                .OrderBy(e => e.LastName)
                .Skip((request.Pagination.PageNumber - 1) * request.Pagination.PageSize)
                .Take(request.Pagination.PageSize)
                .ToListAsync();

            var data = employees.Select(e =>
            {
                var latestLog = e.Account?.ActivityLogs
                    .OrderByDescending(al => al.CreatedAt)
                    .FirstOrDefault();

                var presenceStatus = latestLog?.ActivityType switch
                {
                    "Login" => "Online",
                    "Logout" => "Offline",
                    _ => "Offline"
                };

                return new SearchAccountStatusResponseDTO
                {
                    EmployeeNumber = e.EmployeeNumber,

                    FirstName = e.FirstName,
                    MiddleName = e.MiddleName,
                    LastName = e.LastName,
                    Suffix = e.Suffix,

                    ContactNumber = e.ContactNumber,
                    Role = e.Account?.Role?.Name ?? "No Account",
                    AccountStatus = e.Account?.AccountStatus ?? "No Account",
                    PresenceStatus = presenceStatus,
                    Success = true,
                    Attachments = e.Attachments.Select(a => new OTMS.Entities.DTOs.EmployeeAttachmentDTO
                    {
                        EmployeeAttachmentId = a.EmployeeAttachmentId,
                        FileName = a.FileName,
                        FileUrl = a.FilePath,
                        ContentType = a.ContentType,
                        FileSize = a.FileSize,
                        Version = a.Version
                    }).ToList()
                };
            }).ToList();

            return new PaginationResponseDTO<SearchAccountStatusResponseDTO>
            {
                IsSuccess = true,
                Message = $"Accounts with status '{request.Status}' retrieved successfully.",
                Data = data,
                PageNumber = request.Pagination.PageNumber,
                PageSize = request.Pagination.PageSize,
                TotalRecords = totalEmployees,
                TotalPages = (int)Math.Ceiling(totalEmployees / (double)request.Pagination.PageSize)
            };
        }

        public async Task<PaginationResponseDTO<RecentEmployeesResponseDTO>> GetRecentEmployees(PaginationDTO request, string? search, string? role, string? status)
        {
            var query = context.Employees
                 .Include(e => e.Account)
                     .ThenInclude(a => a.ActivityLogs)
                 .Include(e => e.Attachments)
                 .AsQueryable();

            // Exclude deleted accounts
            query = query.Where(e => e.Account == null || e.Account.AccountStatus != "Deleted");

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(e => e.Account != null && e.Account.AccountStatus == status);
            }

            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(e => e.Account != null && e.Account.Role != null && e.Account.Role.Name == role);
            }

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(e => e.FirstName.ToLower().Contains(lowerSearch) ||
                                         (e.MiddleName != null && e.MiddleName.ToLower().Contains(lowerSearch)) ||
                                         e.LastName.ToLower().Contains(lowerSearch) ||
                                         (e.Suffix != null && e.Suffix.ToLower().Contains(lowerSearch)) ||
                                         e.EmployeeNumber.ToLower().Contains(lowerSearch));
            }

            query = query.OrderByDescending(e => e.CreatedAt);

            var totalRecords = await query.CountAsync();

            var employees = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var data = employees.Select(e =>
            {
                var latestLog = e.Account?.ActivityLogs
                    .OrderByDescending(al => al.CreatedAt)
                    .FirstOrDefault();

                var presenceStatus = latestLog?.ActivityType switch
                {
                    "Login" => "Online",
                    "Logout" => "Offline",
                    _ => "Offline"
                };

                return new RecentEmployeesResponseDTO
                {
                    EmployeeNumber = e.EmployeeNumber,

                    FirstName = e.FirstName,
                    MiddleName = e.MiddleName,
                    LastName = e.LastName,
                    Suffix = e.Suffix,

                    ContactNumber = e.ContactNumber,
                    Email = e.Email,
                    Role = e.Account?.Role?.Name ?? "No Account",
                    AccountStatus = e.Account?.AccountStatus ?? "No Account",
                    PresenceStatus = presenceStatus,
                    Attachments = e.Attachments.Select(a => new OTMS.Entities.DTOs.EmployeeAttachmentDTO
                    {
                        EmployeeAttachmentId = a.EmployeeAttachmentId,
                        FileName = a.FileName,
                        FileUrl = a.FilePath,
                        ContentType = a.ContentType,
                        FileSize = a.FileSize,
                        Version = a.Version
                    }).ToList()
                };
            }).ToList();

            return new PaginationResponseDTO<RecentEmployeesResponseDTO>
            {
                IsSuccess = true,
                Message = "Recent employees retrieved successfully.",
                Data = data,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)request.PageSize)
            };
        }

        public async Task<SearchUserResponseDTO?> SearchUser(SearchUserDTO request)
        {
            var searchFiltered = request.Search.Length > 150
                ? request.Search.Substring(0, 150)
                : request.Search;

            var employee = await context.Employees
                .Include(e => e.Account)
                    .ThenInclude(a => a.ActivityLogs)
                .Include(e => e.Attachments)
                .FirstOrDefaultAsync(e =>
                    e.FirstName.Contains(searchFiltered) ||
                    e.MiddleName.Contains(searchFiltered) ||
                    e.LastName.Contains(searchFiltered) ||
                    e.Suffix.Contains(searchFiltered) ||
                    e.EmployeeNumber.Contains(searchFiltered) ||
                    (e.Account.Role != null && e.Account.Role.Name.Contains(searchFiltered))
                    );

            if (employee is null || employee.Account is null)
            {
                return null;
            }

            var latestLog = employee.Account.ActivityLogs
                .OrderByDescending(al => al.CreatedAt)
                .FirstOrDefault();

            var presenceStatus = latestLog?.ActivityType switch
            {
                "Login" => "Online",
                "Logout" => "Offline",
                _ => "Offline"
            };

            return new SearchUserResponseDTO
            {
                EmployeeNumber = employee.EmployeeNumber,
                FirstName = employee.FirstName,
                MiddleName = employee.MiddleName,
                LastName = employee.LastName,
                Suffix = employee.Suffix,
                Role = employee.Account.Role?.Name ?? string.Empty,
                AccountStatus = employee.Account.AccountStatus,
                PresenceStatus = presenceStatus,
                Success = true,
                Attachments = employee.Attachments.Select(a => new OTMS.Entities.DTOs.EmployeeAttachmentDTO
                {
                    EmployeeAttachmentId = a.EmployeeAttachmentId,
                    FileName = a.FileName,
                    FileUrl = a.FilePath,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    Version = a.Version
                }).ToList()
            };

        }

        public async Task<UpdateEmployeeResponseDTO?> UpdateEmployee(string employeeNumber, UpdateEmployeeDTO request)
        {
            var employee = await context.Employees
                .Include(e => e.Attachments)
                .FirstOrDefaultAsync(e => e.EmployeeNumber == employeeNumber);

            if (employee == null) return null;

            if (request.EmployeeNumber == "string" || String.IsNullOrEmpty(request.EmployeeNumber))
            {
                request.EmployeeNumber = employee.EmployeeNumber;
            }

            if (request.FirstName == "string" || String.IsNullOrEmpty(request.FirstName))
            {
                request.FirstName = employee.FirstName;
            }

            if (request.MiddleName == "string" || String.IsNullOrEmpty(request.MiddleName))
            {
                request.MiddleName = employee.MiddleName;
            }

            if (request.LastName == "string" || String.IsNullOrEmpty(request.LastName))
            {
                request.LastName = employee.LastName;
            }

            if (request.Suffix == "string" || String.IsNullOrEmpty(request.Suffix))
            {
                request.Suffix = employee.Suffix;
            }

            if (request.ContactNumber == "string" || String.IsNullOrEmpty(request.ContactNumber))
            {
                request.ContactNumber = employee.ContactNumber;
            }

            if (request.Email == "string" || String.IsNullOrEmpty(request.Email))
            {
                request.Email = employee.Email;
            }

            var contactNoExists = await context.Employees
                .AnyAsync(e => e.ContactNumber == request.ContactNumber && e.EmployeeNumber != employee.EmployeeNumber);
            if (contactNoExists)
                throw new Exception("Contact Number already exists in another account.");

            var emailExists = await context.Employees
                .AnyAsync(e => e.Email == request.Email && e.EmployeeNumber != employee.EmployeeNumber);
            if (emailExists)
                throw new Exception("Email already exists in another account.");

            // Format Profile Contact Number
            request.ContactNumber = GeneralHelper.ContactNumberFormatter(request.ContactNumber);

            await context.Employees
                .Where(e => e.EmployeeId == employee.EmployeeId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.EmployeeNumber, request.EmployeeNumber)
                    .SetProperty(e => e.FirstName, request.FirstName)
                    .SetProperty(e => e.MiddleName, request.MiddleName)
                    .SetProperty(e => e.LastName, request.LastName)
                    .SetProperty(e => e.Suffix, request.Suffix)
                    .SetProperty(e => e.ContactNumber, request.ContactNumber)
                    .SetProperty(e => e.Email, request.Email)
                    .SetProperty(e => e.UpdatedAt, DateTime.UtcNow));

            if (request.Attachments != null && request.Attachments.Any())
            {
                foreach (var file in request.Attachments)
                {
                    var attachment = await fileService.SaveFileAsync(file, employee.EmployeeId);
                    context.EmployeeAttachments.Add(attachment);
                }
                await context.SaveChangesAsync();
            }
            return new UpdateEmployeeResponseDTO
            {
                EmployeeNumber = request.EmployeeNumber,
                FirstName = request.FirstName ?? employee.FirstName,
                MiddleName = request.MiddleName ?? employee.MiddleName,
                LastName = request.LastName ?? employee.LastName,
                Suffix = request.Suffix ?? employee.Suffix,
                ContactNumber = request.ContactNumber ?? employee.ContactNumber,
                Email = request.Email ?? employee.Email,
                Success = true
            };
        }

    }
}
