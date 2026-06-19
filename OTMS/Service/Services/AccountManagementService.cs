using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using OTMS.Common.Constraints;
using OTMS.Common.Helpers;
using OTMS.Entities.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
        IFileService fileService,
        IConfiguration configuration,
        IHttpContextAccessor httpContextAccessor,
        IActivityLogService activityLogService
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
                     .ThenInclude(a => a.Role)
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

        public async Task<ApiResponseDTO<Digital201FileResponseDTO>> GetDigital201File(string employeeNumber)
        {
            var employee = await context.Employees
                .Include(e => e.Account)
                    .ThenInclude(a => a.Role)
                .Include(e => e.Department)
                .Include(e => e.JobPosition)
                .Include(e => e.Attachments)
                .FirstOrDefaultAsync(e => e.EmployeeNumber == employeeNumber);

            if (employee == null)
            {
                return new ApiResponseDTO<Digital201FileResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Employee not found.",
                    Data = null
                };
            }

            var applicantRecord = await context.ApplicantRecords
                .FirstOrDefaultAsync(ar => ar.EmailAddress == employee.Email);

            ComplianceDataDTO? compliance = null;
            if (applicantRecord != null)
            {
                compliance = new ComplianceDataDTO
                {
                    SssNumber = applicantRecord.SSSNumber ?? "",
                    PhilhealthNumber = applicantRecord.PhilHealthNumber ?? "",
                    PagibigNumber = applicantRecord.PagIBIGNumber ?? "",
                    TinNumber = applicantRecord.TIN,
                    BankName = applicantRecord.BankName ?? "",
                    BankAccountNumber = applicantRecord.BankAccountNumber ?? "",
                    EmergencyContactName = applicantRecord.EmergencyContactName ?? "",
                    EmergencyContactNumber = applicantRecord.EmergencyContactMobileNumber ?? ""
                };
            }

            return new ApiResponseDTO<Digital201FileResponseDTO>
            {
                IsSuccess = true,
                Message = "Digital 201 File retrieved successfully.",
                Data = new Digital201FileResponseDTO
                {
                    EmployeeNumber = employee.EmployeeNumber,
                    FirstName = employee.FirstName,
                    MiddleName = employee.MiddleName,
                    LastName = employee.LastName,
                    Suffix = employee.Suffix,
                    ContactNumber = employee.ContactNumber,
                    Email = employee.Email,
                    DepartmentName = employee.Department?.Name,
                    JobPositionTitle = employee.JobPosition?.Title,
                    DateHired = employee.CreatedAt,
                    Role = employee.Account?.Role?.Name ?? "No Account",
                    AccountStatus = employee.Account?.AccountStatus ?? "No Account",
                    Success = true,
                    Compliance = compliance,
                    Attachments = employee.Attachments.Select(a => new OTMS.Entities.DTOs.EmployeeAttachmentDTO
                    {
                        EmployeeAttachmentId = a.EmployeeAttachmentId,
                        FileName = a.FileName,
                        FileUrl = a.FilePath,
                        ContentType = a.ContentType,
                        FileSize = a.FileSize,
                        Version = a.Version,
                        DocumentType = a.DocumentType,
                        IsArchived = a.IsArchived,
                        DocumentTitle = a.DocumentTitle,
                        IssueDate = a.IssueDate,
                        ExpiryDate = a.ExpiryDate,
                        Remarks = a.Remarks
                    }).ToList()
                }
            };
        }

        public async Task<ApiResponseDTO<EmployeeAttachmentDTO>> UploadEmployeeDocument(string employeeNumber, UploadEmployeeDocumentDTO request)
        {
            var employee = await context.Employees.FirstOrDefaultAsync(e => e.EmployeeNumber == employeeNumber);
            if (employee == null)
                return new ApiResponseDTO<EmployeeAttachmentDTO> { IsSuccess = false, Message = "Employee not found." };

            // 1. Validate File Format (must be PDF, JPG, or PNG)
            var extension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            if (extension != ".pdf" && extension != ".jpg" && extension != ".jpeg" && extension != ".png")
            {
                return new ApiResponseDTO<EmployeeAttachmentDTO> { IsSuccess = false, Message = "Invalid file format. Only PDF, JPG, and PNG are allowed." };
            }

            // 2. Validate File Size (must not exceed 10MB)
            if (request.File.Length > 10 * 1024 * 1024)
            {
                return new ApiResponseDTO<EmployeeAttachmentDTO> { IsSuccess = false, Message = "File exceeds maximum allowable size of 10MB." };
            }

            // 3. Validate Expiry Date (not earlier than Issue Date)
            if (request.ExpiryDate.HasValue && request.ExpiryDate.Value.Date < request.IssueDate.Date)
            {
                return new ApiResponseDTO<EmployeeAttachmentDTO> { IsSuccess = false, Message = "Expiry Date cannot be earlier than Issue Date." };
            }

            var attachment = await fileService.SaveFileAsync(request.File, employee.EmployeeId);
            attachment.DocumentType = request.DocumentType;
            attachment.DocumentTitle = request.DocumentTitle;
            attachment.IssueDate = request.IssueDate;
            attachment.ExpiryDate = request.ExpiryDate;
            attachment.Remarks = request.Remarks;
            attachment.IsArchived = false;

            context.EmployeeAttachments.Add(attachment);
            await context.SaveChangesAsync();

            return new ApiResponseDTO<EmployeeAttachmentDTO>
            {
                IsSuccess = true,
                Message = "Document uploaded and indexed successfully.",
                Data = new EmployeeAttachmentDTO
                {
                    EmployeeAttachmentId = attachment.EmployeeAttachmentId,
                    FileName = attachment.FileName,
                    FileUrl = attachment.FilePath,
                    ContentType = attachment.ContentType,
                    FileSize = attachment.FileSize,
                    Version = attachment.Version,
                    DocumentType = attachment.DocumentType,
                    IsArchived = attachment.IsArchived,
                    DocumentTitle = attachment.DocumentTitle,
                    IssueDate = attachment.IssueDate,
                    ExpiryDate = attachment.ExpiryDate,
                    Remarks = attachment.Remarks
                }
            };
        }

        public async Task<ApiResponseDTO<EmployeeAttachmentDTO>> UpdateEmployeeDocument(Guid attachmentId, UpdateEmployeeDocumentDTO request)
        {
            var attachment = await context.EmployeeAttachments.FirstOrDefaultAsync(a => a.EmployeeAttachmentId == attachmentId);
            if (attachment == null)
                return new ApiResponseDTO<EmployeeAttachmentDTO> { IsSuccess = false, Message = "Document not found." };

            if (!string.IsNullOrEmpty(request.DocumentType))
            {
                attachment.DocumentType = request.DocumentType;
            }

            if (request.IsArchived.HasValue)
            {
                attachment.IsArchived = request.IsArchived.Value;
            }

            if (request.File != null)
            {
                // Optionally delete the old file
                if (!string.IsNullOrEmpty(attachment.FilePath))
                {
                    fileService.DeleteFile(attachment.FilePath);
                }

                var newAttachmentData = await fileService.SaveFileAsync(request.File, attachment.EmployeeId);
                attachment.FileName = newAttachmentData.FileName;
                attachment.FilePath = newAttachmentData.FilePath;
                attachment.ContentType = newAttachmentData.ContentType;
                attachment.FileSize = newAttachmentData.FileSize;
                attachment.Version += 1;
                attachment.UploadedAt = DateTime.UtcNow;
            }

            context.EmployeeAttachments.Update(attachment);
            await context.SaveChangesAsync();

            return new ApiResponseDTO<EmployeeAttachmentDTO>
            {
                IsSuccess = true,
                Message = "Document updated successfully.",
                Data = new EmployeeAttachmentDTO
                {
                    EmployeeAttachmentId = attachment.EmployeeAttachmentId,
                    FileName = attachment.FileName,
                    FileUrl = attachment.FilePath,
                    ContentType = attachment.ContentType,
                    FileSize = attachment.FileSize,
                    Version = attachment.Version,
                    DocumentType = attachment.DocumentType,
                    IsArchived = attachment.IsArchived
                }
            };
        }

        public async Task<ApiResponseDTO<object>> ArchiveEmployeeDocument(Guid attachmentId)
        {
            var attachment = await context.EmployeeAttachments.FirstOrDefaultAsync(a => a.EmployeeAttachmentId == attachmentId);
            if (attachment == null)
                return new ApiResponseDTO<object> { IsSuccess = false, Message = "Document not found." };

            attachment.IsArchived = true;
            context.EmployeeAttachments.Update(attachment);
            await context.SaveChangesAsync();

            return new ApiResponseDTO<object>
            {
                IsSuccess = true,
                Message = "Document archived successfully."
            };
        }

        public async Task<ApiResponseDTO<EmployeeAttachmentDTO>> UploadEmploymentContract(string employeeNumber, UploadEmploymentContractDTO request)
        {
            var employee = await context.Employees.FirstOrDefaultAsync(e => e.EmployeeNumber == employeeNumber);
            if (employee == null)
            {
                return new ApiResponseDTO<EmployeeAttachmentDTO> { IsSuccess = false, Message = "Employee not found." };
            }

            var extension = System.IO.Path.GetExtension(request.File.FileName).ToLower();
            if (extension != ".pdf" || request.File.ContentType.ToLower() != "application/pdf")
            {
                return new ApiResponseDTO<EmployeeAttachmentDTO> { IsSuccess = false, Message = "Invalid file format. Employment contracts must be uploaded as PDF." };
            }

            if (request.File.Length > 15 * 1024 * 1024)
            {
                return new ApiResponseDTO<EmployeeAttachmentDTO> { IsSuccess = false, Message = "File exceeds maximum allowable size of 15MB." };
            }

            if (request.EffectiveEndDate.HasValue && request.EffectiveEndDate.Value.Date < request.EffectiveStartDate.Date)
            {
                return new ApiResponseDTO<EmployeeAttachmentDTO> { IsSuccess = false, Message = "Effective End Date cannot be earlier than Start Date." };
            }

            var existingContracts = await context.EmployeeAttachments
                .Where(a => a.EmployeeId == employee.EmployeeId && a.IsArchived == false && (a.DocumentType == "Employment Contracts" || a.DocumentType == "Contract" || a.DocumentType.Contains("Contract")))
                .ToListAsync();

            bool hasOverlap = false;

            foreach (var c in existingContracts)
            {
                // Check if fully in the past
                if (c.ExpiryDate.HasValue && c.ExpiryDate.Value.Date < request.EffectiveStartDate.Date)
                {
                    c.IsArchived = true;
                    continue;
                }

                // Check if open-ended and starts before new contract (Supersede scenario)
                if (!c.ExpiryDate.HasValue && c.IssueDate.Date < request.EffectiveStartDate.Date)
                {
                    c.ExpiryDate = request.EffectiveStartDate.Date.AddDays(-1);
                    c.IsArchived = true;
                    continue;
                }

                // Check overlap
                var startC = c.IssueDate.Date;
                var endC = c.ExpiryDate?.Date ?? DateTime.MaxValue.Date;
                var startN = request.EffectiveStartDate.Date;
                var endN = request.EffectiveEndDate?.Date ?? DateTime.MaxValue.Date;

                if (startC <= endN && startN <= endC)
                {
                    hasOverlap = true;
                    break;
                }
            }

            if (hasOverlap)
            {
                return new ApiResponseDTO<EmployeeAttachmentDTO> { IsSuccess = false, Message = "Overlapping active contracts detected. Please review effective dates." };
            }

            var attachment = await fileService.SaveFileAsync(request.File, employee.EmployeeId);
            attachment.DocumentType = "Employment Contract";
            attachment.DocumentTitle = request.ContractType;
            attachment.IssueDate = request.EffectiveStartDate;
            attachment.ExpiryDate = request.EffectiveEndDate;
            attachment.IsArchived = false;

            context.EmployeeAttachments.Add(attachment);
            await context.SaveChangesAsync();

            return new ApiResponseDTO<EmployeeAttachmentDTO>
            {
                IsSuccess = true,
                Message = "Contract uploaded successfully. Timeline updated.",
                Data = new EmployeeAttachmentDTO
                {
                    EmployeeAttachmentId = attachment.EmployeeAttachmentId,
                    FileName = attachment.FileName,
                    FileUrl = attachment.FilePath,
                    ContentType = attachment.ContentType,
                    FileSize = attachment.FileSize,
                    Version = attachment.Version,
                    DocumentType = attachment.DocumentType,
                    IsArchived = attachment.IsArchived,
                    DocumentTitle = attachment.DocumentTitle,
                    IssueDate = attachment.IssueDate,
                    ExpiryDate = attachment.ExpiryDate,
                    Remarks = attachment.Remarks
                }
            };
        }

        public async Task<ApiResponseDTO<PaginationResponseDTO<EmploymentContractResponseDTO>>> GetAllEmploymentContracts(PaginationDTO request, string? search, bool? isArchived)
        {
            var query = context.EmployeeAttachments
                .Include(ea => ea.Employee)
                    .ThenInclude(e => e.Department)
                .Include(ea => ea.Employee)
                    .ThenInclude(e => e.JobPosition)
                .Where(ea => ea.DocumentType == "Employment Contracts" || ea.DocumentType == "Contract" || ea.DocumentType.Contains("Contract"));

            if (isArchived.HasValue)
            {
                query = query.Where(ea => ea.IsArchived == isArchived.Value);
            }

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(ea => ea.FileName.ToLower().Contains(lowerSearch) ||
                                          ea.Employee.FirstName.ToLower().Contains(lowerSearch) ||
                                          ea.Employee.LastName.ToLower().Contains(lowerSearch) ||
                                          ea.Employee.EmployeeNumber.ToLower().Contains(lowerSearch));
            }

            var totalRecords = await query.CountAsync();

            var records = await query
                .OrderByDescending(ea => ea.UploadedAt)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var data = records.Select(ea => new EmploymentContractResponseDTO
            {
                EmployeeAttachmentId = ea.EmployeeAttachmentId,
                FileName = ea.FileName,
                FileUrl = ea.FilePath,
                ContentType = ea.ContentType,
                FileSize = ea.FileSize,
                Version = ea.Version,
                DocumentType = ea.DocumentType,
                IsArchived = ea.IsArchived,
                UploadedAt = ea.UploadedAt,
                ContractStatus = ea.IsArchived 
                    ? "Archived" 
                    : (ea.IssueDate.Date > DateTime.UtcNow.Date 
                        ? "Pending Activation" 
                        : (ea.ExpiryDate.HasValue && ea.ExpiryDate.Value.Date < DateTime.UtcNow.Date ? "Archived" : "Active")),
                DocumentTitle = ea.DocumentTitle,
                IssueDate = ea.IssueDate,
                ExpiryDate = ea.ExpiryDate,
                Remarks = ea.Remarks,
                EmployeeNumber = ea.Employee.EmployeeNumber,
                FirstName = ea.Employee.FirstName,
                LastName = ea.Employee.LastName,
                DepartmentName = ea.Employee.Department?.Name,
                JobPositionTitle = ea.Employee.JobPosition?.Title
            }).ToList();

            return new ApiResponseDTO<PaginationResponseDTO<EmploymentContractResponseDTO>>
            {
                IsSuccess = true,
                Message = "Employment contracts retrieved successfully.",
                Data = new PaginationResponseDTO<EmploymentContractResponseDTO>
                {
                    IsSuccess = true,
                    Message = "Employment contracts retrieved successfully.",
                    Data = data,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalRecords = totalRecords,
                    TotalPages = (int)Math.Ceiling(totalRecords / (double)request.PageSize)
                }
            };
        }

        public async Task<ApiResponseDTO<PaginationResponseDTO<EmployeeAttachmentDTO>>> GetAllEmployeeDocuments(PaginationDTO request, string? search, string? documentType, bool? isArchived)
        {
            var query = context.EmployeeAttachments
                .Include(ea => ea.Employee)
                .AsQueryable();

            if (!string.IsNullOrEmpty(documentType))
            {
                query = query.Where(ea => ea.DocumentType == documentType);
            }

            if (isArchived.HasValue)
            {
                query = query.Where(ea => ea.IsArchived == isArchived.Value);
            }

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(ea =>
                    ea.FileName.ToLower().Contains(lowerSearch) ||
                    ea.DocumentTitle.ToLower().Contains(lowerSearch) ||
                    ea.Employee.FirstName.ToLower().Contains(lowerSearch) ||
                    ea.Employee.LastName.ToLower().Contains(lowerSearch) ||
                    ea.Employee.EmployeeNumber.ToLower().Contains(lowerSearch));
            }

            var totalRecords = await query.CountAsync();

            var records = await query
                .OrderByDescending(ea => ea.UploadedAt)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var data = records.Select(ea => new EmployeeAttachmentDTO
            {
                EmployeeAttachmentId = ea.EmployeeAttachmentId,
                FileName = ea.FileName,
                FileUrl = ea.FilePath,
                ContentType = ea.ContentType,
                FileSize = ea.FileSize,
                Version = ea.Version,
                DocumentType = ea.DocumentType,
                IsArchived = ea.IsArchived,
                DocumentTitle = ea.DocumentTitle,
                IssueDate = ea.IssueDate,
                ExpiryDate = ea.ExpiryDate,
                Remarks = ea.Remarks,
                EmployeeNumber = ea.Employee.EmployeeNumber,
                EmployeeName = string.Join(" ", new[] { ea.Employee.FirstName, ea.Employee.MiddleName, ea.Employee.LastName, ea.Employee.Suffix }.Where(s => !string.IsNullOrWhiteSpace(s))),
                FirstName = ea.Employee.FirstName ?? "",
                LastName = ea.Employee.LastName ?? ""
            }).ToList();

            return new ApiResponseDTO<PaginationResponseDTO<EmployeeAttachmentDTO>>
            {
                IsSuccess = true,
                Message = "Documents retrieved successfully.",
                Data = new PaginationResponseDTO<EmployeeAttachmentDTO>
                {
                    IsSuccess = true,
                    Message = "Documents retrieved successfully.",
                    Data = data,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalRecords = totalRecords,
                    TotalPages = (int)Math.Ceiling(totalRecords / (double)request.PageSize)
                }
            };
        }

        private static readonly Regex SssRegex = new(@"^\d{2}-\d{7}-\d{1}$");
        private static readonly Regex PhilhealthRegex = new(@"^\d{2}-\d{9}-\d{1}$");
        private static readonly Regex PagibigRegex = new(@"^\d{4}-\d{4}-\d{4}$");
        private static readonly Regex TinRegex = new(@"^\d{3}-\d{3}-\d{3}-\d{3}$");

        public async Task<ApiResponseDTO<string>> UpdateStatutoryRecordsAsync(UpdateStatutoryRecordsDTO request)
        {
            var currentAccountId = GetCurrentAccountId();
            if (currentAccountId == null)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Unauthorized. Please log in again.",
                    Data = null
                };
            }

            var employee = await context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeNumber == request.EmployeeNumber.Trim());

            if (employee == null)
            {
                return new ApiResponseDTO<string>
                {
                    IsSuccess = false,
                    Message = "Employee not found.",
                    Data = null
                };
            }

            if (!SssRegex.IsMatch(request.SssNumber))
                return new ApiResponseDTO<string> { IsSuccess = false, Message = "Invalid SSS Number format detected. Expected format: XX-XXXXXXX-X.", Data = null };

            if (!PhilhealthRegex.IsMatch(request.PhilhealthNumber))
                return new ApiResponseDTO<string> { IsSuccess = false, Message = "Invalid PhilHealth Number format detected. Expected format: XX-XXXXXXXXX-X.", Data = null };

            if (!PagibigRegex.IsMatch(request.PagibigNumber))
                return new ApiResponseDTO<string> { IsSuccess = false, Message = "Invalid Pag-IBIG Number format detected. Expected format: XXXX-XXXX-XXXX.", Data = null };

            if (!TinRegex.IsMatch(request.TinNumber))
                return new ApiResponseDTO<string> { IsSuccess = false, Message = "Invalid TIN format detected. Expected format: XXX-XXX-XXX-XXX.", Data = null };

            var existingData = await context.Employee201FileDatas
                .FirstOrDefaultAsync(e => e.EmployeeId == employee.EmployeeId);

            if (existingData != null)
            {
                existingData.SssNumberEncrypted = DataEncryptionHelper.Encrypt(request.SssNumber, configuration);
                existingData.PhilhealthNumberEncrypted = DataEncryptionHelper.Encrypt(request.PhilhealthNumber, configuration);
                existingData.PagibigNumberEncrypted = DataEncryptionHelper.Encrypt(request.PagibigNumber, configuration);
                existingData.TinNumberEncrypted = DataEncryptionHelper.Encrypt(request.TinNumber, configuration);
                existingData.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var newData = new Employee201FileData
                {
                    Employee201FileDataId = Guid.NewGuid(),
                    EmployeeId = employee.EmployeeId,
                    SssNumberEncrypted = DataEncryptionHelper.Encrypt(request.SssNumber, configuration),
                    PhilhealthNumberEncrypted = DataEncryptionHelper.Encrypt(request.PhilhealthNumber, configuration),
                    PagibigNumberEncrypted = DataEncryptionHelper.Encrypt(request.PagibigNumber, configuration),
                    TinNumberEncrypted = DataEncryptionHelper.Encrypt(request.TinNumber, configuration),
                    CreatedAt = DateTime.UtcNow
                };
                context.Employee201FileDatas.Add(newData);
            }

            var syncRecord = new StatutorySyncRecord
            {
                StatutorySyncRecordId = Guid.NewGuid(),
                EmployeeId = employee.EmployeeId,
                TargetSystem = "FOMS",
                SyncStatus = "Successful",
                SyncTimestamp = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            context.StatutorySyncRecords.Add(syncRecord);

            // Update bank and emergency contact info on ApplicantRecord
            if (!string.IsNullOrEmpty(request.BankName) || !string.IsNullOrEmpty(request.EmergencyContactName))
            {
                var applicant = await context.ApplicantRecords
                    .FirstOrDefaultAsync(ar => ar.EmailAddress == employee.Email);
                if (applicant != null)
                {
                    if (!string.IsNullOrEmpty(request.BankName)) applicant.BankName = request.BankName;
                    if (!string.IsNullOrEmpty(request.BankAccountNumber)) applicant.BankAccountNumber = request.BankAccountNumber;
                    if (!string.IsNullOrEmpty(request.EmergencyContactName)) applicant.EmergencyContactName = request.EmergencyContactName;
                    if (!string.IsNullOrEmpty(request.EmergencyContactNumber)) applicant.EmergencyContactMobileNumber = request.EmergencyContactNumber;
                }
            }

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                currentAccountId.Value,
                ActivityTypes.StatutoryRecordsUpdated,
                $"Statutory records updated for employee {employee.EmployeeNumber}. SSS/PhilHealth/Pag-IBIG/TIN encrypted and synced with FOMS."
            );

            return new ApiResponseDTO<string>
            {
                IsSuccess = true,
                Message = "Government records saved successfully. Statutory identifiers synchronized with FOMS.",
                Data = employee.EmployeeNumber
            };
        }

        public async Task<ApiResponseDTO<IEnumerable<StatutorySyncRecordResponseDTO>>> GetStatutorySyncRecordsAsync(string employeeNumber)
        {
            var employee = await context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeNumber == employeeNumber.Trim());

            if (employee == null)
            {
                return new ApiResponseDTO<IEnumerable<StatutorySyncRecordResponseDTO>>
                {
                    IsSuccess = false,
                    Message = "Employee not found.",
                    Data = null
                };
            }

            var records = await context.StatutorySyncRecords
                .Where(s => s.EmployeeId == employee.EmployeeId)
                .OrderByDescending(s => s.SyncTimestamp)
                .Select(s => new StatutorySyncRecordResponseDTO
                {
                    SyncRecordId = s.StatutorySyncRecordId,
                    TargetSystem = s.TargetSystem,
                    SyncStatus = s.SyncStatus,
                    SyncTimestamp = s.SyncTimestamp,
                    ErrorMessage = s.ErrorMessage
                })
                .ToListAsync();

            return new ApiResponseDTO<IEnumerable<StatutorySyncRecordResponseDTO>>
            {
                IsSuccess = true,
                Message = "Sync records retrieved successfully.",
                Data = records
            };
        }

        private Guid? GetCurrentAccountId()
        {
            var claim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var id))
                return null;
            return id;
        }
    }
}
