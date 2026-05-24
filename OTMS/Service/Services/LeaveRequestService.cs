using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using OTMS.Data;
using OTMS.Entities.DTOs.LeaveRequest;
using OTMS.Entities.DTOs.LeaveRequest.Responses;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Service.Services
{
    public class LeaveRequestService(
        OTMSDbContext context,
        IHttpContextAccessor httpContextAccessor
        ) : ILeaveRequest
    {
        public async Task<LeaveRequestResponseDTO> CreateLeaveRequestAsync(CreateLeaveRequestDTO request)
        {
            // Get the Account
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

            // Validate
            if (request.End_Date < request.Start_Date)
            {
                throw new ArgumentException("End date cannot be before start date.");
            }

            // Convert DTO to Entity
            var leaveRequest = new LeaveRequest
            {
                AccountId = profile.Account.AccountId,
                Start_Date = request.Start_Date,
                End_Date = request.End_Date,
                Reason = request.Reason,
                Approval_Status = "Pending"
            };

            context.LeaveRequests.Add(leaveRequest);
            await context.SaveChangesAsync();

            return new LeaveRequestResponseDTO
            {
                LeaveId = leaveRequest.LeaveId,
                AccountId = leaveRequest.AccountId,
                Start_Date = leaveRequest.Start_Date,
                End_Date = leaveRequest.End_Date,
                Reason = leaveRequest.Reason,
                Approval_Status = leaveRequest.Approval_Status
            };
        }
    }
}
