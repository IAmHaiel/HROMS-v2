using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.EmergencyOverrideRequest;
using OTMS.Entities.DTOs.EmergencyOverrideRequest.Responses;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Service.Services
{
    public class EmergencyOverrideService(IHttpContextAccessor httpContextAccessor, OTMSDbContext context, INotificationService notificationService) : IEmergencyOverrideService
    {
        public async Task<EmergencyOverrideResponseDTO> ApproveOverrideAsync(ApproveEmergencyOverrideDTO request)
        {
            var emergencyOverride = await context.EmergencyOverrideRequests
                .Include(e => e.RequestedBy)
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

            emergencyOverride.RequestedBy.AccountStatus = "Emergency Overriden";

            await context.SaveChangesAsync();

            return new EmergencyOverrideResponseDTO
            {
                EmergencyOverrideId = emergencyOverride.EmergencyOverrideId,
                RequestedById = emergencyOverride.RequestedById,
                LeaveId = emergencyOverride.LeaveId,
                Status = emergencyOverride.Status,
                Reason = emergencyOverride.Reason,
                RequestedAt = emergencyOverride.RequestedAt,
                ApprovedAt = emergencyOverride.ApprovedAt,
                OverrideUntil = emergencyOverride.OverrideUntil
            };
        }

        public async Task<EmergencyOverrideResponseDTO> DeclineOverrideAsync(DeclineEmergencyOverrideDTO request)
        {
            var emergencyOverride = await context.EmergencyOverrideRequests
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

            await context.SaveChangesAsync();

            return new EmergencyOverrideResponseDTO
            {
                EmergencyOverrideId = emergencyOverride.EmergencyOverrideId,
                RequestedById = emergencyOverride.RequestedById,
                LeaveId = emergencyOverride.LeaveId,
                Status = emergencyOverride.Status,
                Reason = emergencyOverride.Reason,
                RequestedAt = emergencyOverride.RequestedAt,
                ApprovedAt = emergencyOverride.ApprovedAt,
                OverrideUntil = emergencyOverride.OverrideUntil
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

        public async Task<EmergencyOverrideResponseDTO>  RequestOverrideAsync(CreateEmergencyOverrideRequestDTO request)
        {
           var account = await context.Accounts
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
                OverrideUntil = emergencyOverride.OverrideUntil
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

            return new UpdateEmergencyOverrideDTO
            {
                EmergencyOverrideId = request.EmergencyOverrideId,
                Reason = request.Reason,
                UpdatedAt = DateTime.UtcNow
            };
                
        }
    }
}
