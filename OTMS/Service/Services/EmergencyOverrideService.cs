using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.EmergencyOverrideRequest;
using OTMS.Entities.DTOs.EmergencyOverrideRequest.Responses;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace OTMS.Service.Services
{
    public class EmergencyOverrideService(IHttpContextAccessor httpContextAccessor, OTMSDbContext context, INotificationService notificationService, IActivityLogService activityLogService) : IEmergencyOverrideService
    {
        public async Task<EmergencyOverrideResponseDTO> ApproveOverrideAsync(ApproveEmergencyOverrideDTO request)
        {
            var emergencyOverride = await context.EmergencyOverrideRequests
                .Include(e => e.RequestedBy)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(e =>
                    e.EmergencyOverrideId == request.EmergencyOverrideId);

            if (emergencyOverride == null)
                throw new Exception("Emergency override request not found.");

            if (emergencyOverride.Status != "Pending")
                throw new InvalidOperationException("Only pending requests can be approved.");

            var approver = await context.Accounts
                .FirstOrDefaultAsync(a => a.AccountId == request.ApproverAccountId);

            if (approver == null)
                throw new Exception("Approver account not found.");

            emergencyOverride.Status = "Approved";
            emergencyOverride.ApprovedById = request.ApproverAccountId;
            emergencyOverride.ApprovedAt = DateTime.UtcNow;
            emergencyOverride.OverrideUntil = request.OverrideUntil;

            var approverAccount = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == request.ApproverAccountId);
            emergencyOverride.ApprovedBy = approverAccount;

            emergencyOverride.RequestedBy.AccountStatus = "Emergency Overriden";

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                request.ApproverAccountId,
                ActivityTypes.EmergencyOverrideUpdated,
                $"{string.Join(" ", new[]
                    {approverAccount.Employee.FirstName, approverAccount.Employee.MiddleName, approverAccount.Employee.LastName, approverAccount.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the Emergency Override Request Status to {emergencyOverride.Status} at {DateTime.Now:hh:mm tt}");

            return new EmergencyOverrideResponseDTO
            {
                EmergencyOverrideId = emergencyOverride.EmergencyOverrideId,
                RequestedById = emergencyOverride.RequestedById,
                LeaveId = emergencyOverride.LeaveId,
                Status = emergencyOverride.Status,
                Reason = emergencyOverride.Reason,
                RequestedAt = emergencyOverride.RequestedAt,
                ApprovedAt = emergencyOverride.ApprovedAt,
                OverrideUntil = emergencyOverride.OverrideUntil,
                EmployeeName = emergencyOverride.RequestedBy != null && emergencyOverride.RequestedBy.Employee != null 
                    ? emergencyOverride.RequestedBy.Employee.FirstName + " " + emergencyOverride.RequestedBy.Employee.LastName 
                    : string.Empty,
                EmployeeNumber = emergencyOverride.RequestedBy != null && emergencyOverride.RequestedBy.Employee != null 
                    ? emergencyOverride.RequestedBy.Employee.EmployeeNumber 
                    : string.Empty
            };
        }

        public async Task<EmergencyOverrideResponseDTO> DeclineOverrideAsync(DeclineEmergencyOverrideDTO request)
        {
            var emergencyOverride = await context.EmergencyOverrideRequests
                .Include(e => e.RequestedBy)
                    .ThenInclude(a => a.Employee)
                .FirstOrDefaultAsync(e =>
                    e.EmergencyOverrideId == request.EmergencyOverrideId);

            if (emergencyOverride == null)
                throw new Exception("Emergency override request not found.");

            if (emergencyOverride.Status != "Pending")
                throw new InvalidOperationException("Only pending requests can be declined.");

            var approver = await context.Accounts
                .FirstOrDefaultAsync(a => a.AccountId == request.ApproverAccountId);

            if (approver == null)
                throw new Exception("Approver account not found.");

            emergencyOverride.Status = "Declined";
            emergencyOverride.ApprovedById = request.ApproverAccountId;
            emergencyOverride.ApprovedAt = DateTime.UtcNow;

            var approverAccount = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == request.ApproverAccountId);
            emergencyOverride.ApprovedBy = approverAccount;

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                request.ApproverAccountId,
                ActivityTypes.EmergencyOverrideUpdated,
                $"{string.Join(" ", new[]
                    {approverAccount.Employee.FirstName, approverAccount.Employee.MiddleName, approverAccount.Employee.LastName, approverAccount.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the Emergency Override Request Status to {emergencyOverride.Status} at {DateTime.Now:hh:mm tt}");

            return new EmergencyOverrideResponseDTO
            {
                EmergencyOverrideId = emergencyOverride.EmergencyOverrideId,
                RequestedById = emergencyOverride.RequestedById,
                LeaveId = emergencyOverride.LeaveId,
                Status = emergencyOverride.Status,
                Reason = emergencyOverride.Reason,
                RequestedAt = emergencyOverride.RequestedAt,
                ApprovedAt = emergencyOverride.ApprovedAt,
                OverrideUntil = emergencyOverride.OverrideUntil,
                EmployeeName = emergencyOverride.RequestedBy != null && emergencyOverride.RequestedBy.Employee != null 
                    ? emergencyOverride.RequestedBy.Employee.FirstName + " " + emergencyOverride.RequestedBy.Employee.LastName 
                    : string.Empty,
                EmployeeNumber = emergencyOverride.RequestedBy != null && emergencyOverride.RequestedBy.Employee != null 
                    ? emergencyOverride.RequestedBy.Employee.EmployeeNumber 
                    : string.Empty
            };
        }

        public async Task<ApiResponseDTO<object>> DeleteEmergencyOverrideAsync(Guid EmergencyOverrideId)
        {
            var emergencyOverride = await context.EmergencyOverrideRequests
                .FirstOrDefaultAsync(eor => eor.EmergencyOverrideId == EmergencyOverrideId);

            if (emergencyOverride == null)
                throw new Exception("Emergency Override doesn't exist.");

            emergencyOverride.Deleted = true;
            emergencyOverride.UpdatedAt = DateTime.UtcNow;
            
            await context.SaveChangesAsync();

            return new ApiResponseDTO<object>
            {
                IsSuccess = true,
                Message = "Emergency Override Request deleted.",
                Data = null
            };

        }

        public async Task<EmergencyOverrideResponseDTO> RequestOverrideAsync(CreateEmergencyOverrideRequestDTO request)
        {
           var account = await context.Accounts
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.AccountId == request.AccountId);

            if (account == null)
                throw new Exception("Account not found.");

            if (account.AccountStatus != "On Leave")
                throw new InvalidOperationException("Only employees currently on leave can request an emergency override.");

            var leaveRequest = await context.LeaveRequests
                .FirstOrDefaultAsync(l => 
                    l.LeaveId == request.LeaveId &&
                    l.AccountId == request.AccountId &&
                    l.Approval_Status == "Approved" &&
                    !l.Deleted);

            if (leaveRequest == null)
                throw new InvalidOperationException("Valid approved leave request not found for the employee.");

            var existingPendingRequest = await context.EmergencyOverrideRequests
                .AnyAsync(e =>
                    e.LeaveId == request.LeaveId &&
                    e.Status == "Pending");

            if (existingPendingRequest)
                throw new InvalidOperationException("An emergency override request for this leave is already pending.");

            var reasonFiltered = request.Reason.Length > 500
                ? request.Reason.Substring(0, 500)
                : request.Reason;


            var emergencyOverride = new EmergencyOverrideRequest
            {
                EmergencyOverrideId = Guid.NewGuid(),
                RequestedById = request.AccountId,
                LeaveId = request.LeaveId,
                Status = "Pending",
                Reason = request.Reason,
                RequestedAt = DateTime.UtcNow
            };

            context.EmergencyOverrideRequests.Add(emergencyOverride);
            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                emergencyOverride.RequestedById,
                ActivityTypes.EmergencyOverrideRequested,
                $"{string.Join(" ", new[]
                    {emergencyOverride.RequestedBy.Employee.FirstName, emergencyOverride.RequestedBy.Employee.MiddleName, emergencyOverride.RequestedBy.Employee.LastName, emergencyOverride.RequestedBy.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} submitted an Emergency Override at {DateTime.Now:hh:mm tt}");

            // Send Notification
            await notificationService.CreateEmergencyOverrideNotificationAsync(emergencyOverride);

            return new EmergencyOverrideResponseDTO
            {
                EmergencyOverrideId = emergencyOverride.EmergencyOverrideId,
                RequestedById = emergencyOverride.RequestedById,
                LeaveId = emergencyOverride.LeaveId,
                Status = emergencyOverride.Status,
                Reason = emergencyOverride.Reason,
                RequestedAt = emergencyOverride.RequestedAt,
                ApprovedAt = emergencyOverride.ApprovedAt,
                OverrideUntil = emergencyOverride.OverrideUntil,
                EmployeeName = account.Employee != null 
                    ? account.Employee.FirstName + " " + account.Employee.LastName 
                    : string.Empty,
                EmployeeNumber = account.Employee?.EmployeeNumber ?? string.Empty
            };

        }

        public async Task<UpdateEmergencyOverrideDTO> UpdateEmergencyOverrideAsync(UpdateEmergencyOverrideDTO request)
        {
            var emergencyOverrideRequest = await context.EmergencyOverrideRequests
                .Include(eor => eor.RequestedBy)
                .FirstOrDefaultAsync(eor => eor.EmergencyOverrideId ==  request.EmergencyOverrideId);

            if (emergencyOverrideRequest == null)
                throw new Exception("Emergency Override Request doesn't exist.");

            emergencyOverrideRequest.Reason = request.Reason;
            emergencyOverrideRequest.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            await activityLogService.LogActivityAsync(
                emergencyOverrideRequest.RequestedById,
                ActivityTypes.EmergencyOverrideUpdated,
                $"{string.Join(" ", new[]
                    {emergencyOverrideRequest.RequestedBy.Employee.FirstName, emergencyOverrideRequest.RequestedBy.Employee.MiddleName, emergencyOverrideRequest.RequestedBy.Employee.LastName, emergencyOverrideRequest.RequestedBy.Employee.Suffix}.Where(n => !string.IsNullOrEmpty(n)))} updated the Emergency Override Request"); 

            return new UpdateEmergencyOverrideDTO
            {
                EmergencyOverrideId = request.EmergencyOverrideId,
                Reason = request.Reason,
                UpdatedAt = DateTime.UtcNow
            };
                
        }
    }
}
