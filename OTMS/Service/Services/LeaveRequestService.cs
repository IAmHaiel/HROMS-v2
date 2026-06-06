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
                Leave_Type = request.Leave_Type,
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
                Leave_Type = leaveRequest.Leave_Type,
                Reason = leaveRequest.Reason,
                Approval_Status = leaveRequest.Approval_Status
            };
        }

        public async Task<List<LeaveRequestResponseDTO>> GetAllLeaveRequestsAsync()
        {
            return await context.LeaveRequests
                .Include(lr => lr.Account)
                    .ThenInclude(a => a.Employee)
                .OrderByDescending(lr => lr.Start_Date)
                .Select(lr => new LeaveRequestResponseDTO
                {
                    LeaveId = lr.LeaveId,
                    AccountId = lr.AccountId,
                    EmployeeNumber = lr.Account.Employee.EmployeeNumber,
                    EmployeeName = lr.Account.Employee.EmployeeName,
                    Role = lr.Account.Role,
                    Start_Date = lr.Start_Date,
                    End_Date = lr.End_Date,
                    Leave_Type = lr.Leave_Type,
                    Reason = lr.Reason,
                    Approval_Status = lr.Approval_Status,
                    LeaveRequestNote = lr.LeaveRequestNote,
                    SubmittedAt = lr.Start_Date         
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<object>> GetMyLeaveRequestsAsync(Guid accountId)
        {
            return await context.LeaveRequests
                .Where(l => l.AccountId == accountId && l.Deleted == false)
                .OrderByDescending(l => l.Start_Date)
                .Select(l => new
                {
                    l.LeaveId,
                    l.AccountId,
                    l.Leave_Type,
                    l.Start_Date,
                    l.End_Date,
                    l.Reason,
                    l.Approval_Status,
                    l.LeaveRequestNote,
                    l.Approved_By,
                })
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task UpdateEmployeeAvailabilityStatusesAsync(Guid accountId)
        {
            var currentDate = DateTime.UtcNow.Date;

            var account = await context.Accounts
                .Include(a => a.SubmittedLeaveRequests)
                .Include(a => a.RequestedEmergencyOverrides)
                .FirstOrDefaultAsync(a => a.AccountId == accountId);

            if (account is null)
            {
                throw new Exception("Account not found.");
            }

            // On Leave
            bool isOnLeave = account.SubmittedLeaveRequests
                .Any(lr =>
                    lr.Approval_Status == "Approved" &&
                    currentDate.Date >= lr.Start_Date.Date &&
                    currentDate.Date <= lr.End_Date.Date);

            account.AccountStatus = isOnLeave
                ? "On Leave"
                : "Active";

            // Emergency Overriden
            bool hasActiveOverride = account.RequestedEmergencyOverrides
                .Any(e =>
                    e.Status == "Approved" &&
                    e.OverrideUntil > currentDate);

            if (hasActiveOverride)
                account.AccountStatus = "Emergency Overriden";

            await context.SaveChangesAsync();
            return;
        }

        public async Task<bool> UpdateLeaveStatusAsync(Guid leaveId, UpdateLeaveStatusDTO request)
        {
            var leaveRequest = await context.LeaveRequests
                .FirstOrDefaultAsync(lr => lr.LeaveId == leaveId);

            if (leaveRequest == null)
                return false;

            // Get the Account
            var claimProfile = httpContextAccessor
               .HttpContext?
               .User
               .FindFirst(ClaimTypes.NameIdentifier)?
               .Value;

            if (string.IsNullOrEmpty(claimProfile))
                return false;

            var profile = await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => e.Account.AccountId.ToString() == claimProfile);

            if (profile is null || profile.Account is null)
                return false;

            leaveRequest.Approved_By = profile.Account.AccountId;
            leaveRequest.Approval_Status = request.Approval_Status;
            leaveRequest.LeaveRequestNote = request.LeaveRequestNote;
            await context.SaveChangesAsync();

            return true;
        }
    }
}