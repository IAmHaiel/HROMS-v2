using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs.Profile;
using OTMS.Entities.DTOs.Profile.Responses;
using OTMS.Entities.Models;
using OTMS.Service.Helper;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Service.Services
{
    public class ProfileService(
        OTMSDbContext context,
        IHttpContextAccessor httpContextAccessor,
        IActivityLogService activityLogService,
        IFileService fileService
        ) : IProfileService
    {
        public async Task<ChangePasswordResponseDTO?> ChangePassword(ChangePasswordDTO request)
        {
            var claimProfile = httpContextAccessor
               .HttpContext?
               .User
               .FindFirst(ClaimTypes.NameIdentifier)?
               .Value;

            if (string.IsNullOrEmpty(claimProfile))
                return null;

            var profile = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.Account.AccountId.ToString() == claimProfile);

            if (profile is null || profile.Account is null)
                return null;

            if (request.NewPassword.Length < PasswordLength.MinimumLength || request.NewPassword.Length > PasswordLength.MaximumLength)
            {
                return new ChangePasswordResponseDTO
                {
                    EmployeeNumber = profile.EmployeeNumber,
                    Success = false
                };
            }

            // Change Password
            var passwordHasher = new PasswordHasher<Account>();

            var verificationResult = passwordHasher.VerifyHashedPassword(
                profile.Account, 
                profile.Account.PasswordHash, 
                request.CurrentPassword
                );

            // Check if the current password is correct
            if (verificationResult == PasswordVerificationResult.Success)
            {
                // Check if the new password is the same as the current password
                if (request.CurrentPassword == request.NewPassword)
                {
                    return new ChangePasswordResponseDTO
                    {
                        EmployeeNumber = profile.EmployeeNumber,
                        Success = false
                    };
                }
            }

            if(verificationResult == PasswordVerificationResult.Failed)
            {
                return new ChangePasswordResponseDTO
                {
                    EmployeeNumber = profile.EmployeeNumber,
                    Success = false
                };
            }

            profile.Account.PasswordHash = passwordHasher.HashPassword(
                profile.Account, 
                request.NewPassword
                );
            profile.UpdatedAt = DateTime.UtcNow;
            profile.Account.UpdatedAt = DateTime.UtcNow;
            profile.Account.IsPasswordChanged = true;

            await context.SaveChangesAsync();
            
            return new ChangePasswordResponseDTO
            {
                EmployeeNumber = profile.EmployeeNumber,
                NewPassword = request.NewPassword,
                Success = true
            };
        }

        public async Task<UpdateInformationResponseDTO?> UpdateBasicInformation(UpdateInformationDTO request)
        {
            var claimProfile = httpContextAccessor
                .HttpContext?
                .User
                .FindFirst(ClaimTypes.NameIdentifier)?
                .Value;

            if (string.IsNullOrEmpty(claimProfile))
                return null;

            var profile = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.Account.AccountId.ToString() == claimProfile);

            if (profile is null && profile.Account is null)
                return null;

            if (request.FirstName == "string" || String.IsNullOrEmpty (request.FirstName))
                request.FirstName = profile.FirstName;

            if (request.MiddleName == "string" || String.IsNullOrEmpty(request.MiddleName))
                request.MiddleName = profile.MiddleName;

            if (request.LastName == "string" || String.IsNullOrEmpty(request.LastName))
                request.LastName = profile.LastName;

            if (request.Suffix == "string" || String.IsNullOrEmpty(request.Suffix))
                request.Suffix = profile.Suffix;

            if (request.ContactNumber == "string" || String.IsNullOrEmpty(request.ContactNumber))
                request.ContactNumber = profile.ContactNumber;

            if (request.Email == "string" || String.IsNullOrEmpty(request.Email))
                request.Email = profile.Email;

            var contactNoExists = await context.Employees
                .AnyAsync(e => e.ContactNumber == request.ContactNumber && e.EmployeeNumber != profile.EmployeeNumber);
            if (contactNoExists)
                throw new Exception("Contact number already exists.");

            var emailExists = await context.Employees
                .AnyAsync(e => e.Email == request.Email && e.EmployeeNumber != profile.EmployeeNumber);
            if (emailExists)
                throw new Exception("Email already exists.");


            // Format Profile Contact Number
            request.ContactNumber = GeneralHelper.ContactNumberFormatter(request.ContactNumber);

            // Save the updated information to the database
            profile.FirstName = request.FirstName;
            profile.MiddleName = request.MiddleName;
            profile.LastName = request.LastName;
            profile.Suffix = request.Suffix;
            profile.ContactNumber = request.ContactNumber;
            profile.Email = request.Email;
            profile.UpdatedAt = DateTime.UtcNow;

            if (request.Attachments != null && request.Attachments.Any())
            {
                foreach (var file in request.Attachments)
                {
                    var attachment = await fileService.SaveFileAsync(file, profile.EmployeeId);
                    context.EmployeeAttachments.Add(attachment);
                }
            }

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                profile.Account.AccountId,
                ActivityTypes.ProfileUpdate,
                $"{string.Join(" ", new[] { profile.FirstName, profile.MiddleName, profile.LastName, profile.Suffix }.Where(n => !string.IsNullOrEmpty(n)))} updated their profile information."
            );

            return new UpdateInformationResponseDTO
            {
                EmployeeNumber = profile.EmployeeNumber,
                FirstName = profile.FirstName,
                MiddleName = profile.MiddleName,
                LastName = profile.LastName,
                Suffix = profile.Suffix,
                ContactNumber = request.ContactNumber,
                Email = request.Email,
                UpdatedAt = profile.UpdatedAt.Value,
                Success = true
            };

        }


        public async Task<ViewProfileResponseDTO?> ViewProfile()
        {
            var claimProfile = httpContextAccessor
                .HttpContext?
                .User
                .FindFirst(ClaimTypes.NameIdentifier)?
                .Value;

            if (string.IsNullOrEmpty(claimProfile))
                return null;

            var profile = await context.Employees
                .Include(e => e.Account)
                    .ThenInclude(a => a.ActivityLogs)
                .Include(e => e.Attachments)
                .FirstOrDefaultAsync(e => e.Account.AccountId.ToString() == claimProfile);

            if (profile is null && profile.Account is null)
                return null;

            var latestLog = profile.Account.ActivityLogs
                .OrderByDescending(al => al.CreatedAt)
                .FirstOrDefault();

            var presenceStatus = latestLog?.ActivityType switch
            {
                "Login" => "Online",
                "Logout" => "Offline",
                _ => "Offline"
            };

            return new ViewProfileResponseDTO
            {
                EmployeeNumber = profile.EmployeeNumber,
                FirstName = profile.FirstName,
                MiddleName = profile.MiddleName,
                LastName = profile.LastName,
                Suffix = profile.Suffix,
                ContactNumber = profile.ContactNumber,
                Email = profile.Email,
                AccountStatus = profile.Account.AccountStatus,
                Role = profile.Account.Role,
                PresenceStatus = presenceStatus,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt ?? profile.CreatedAt,
                Attachments = profile.Attachments.Select(a => new OTMS.Entities.DTOs.EmployeeAttachmentDTO
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
    }
}
