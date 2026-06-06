using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.EmergencyOverrideRequest;
using OTMS.Entities.DTOs.EmergencyOverrideRequest.Responses;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;
using System.Security.Claims;

namespace OTMS.Service.Services
{
    public class EmergencyOverrideService(IHttpContextAccessor httpContextAccessor, OTMSDbContext context) : IEmergencyOverrideService
    {
        public async Task<EmergencyOverrideResponseDTO> ApproveOverrideAsync(ApproveEmergencyOverrideDTO request)
        {
            var accountIdClaim = httpContextAccessor
                .HttpContext?
                .User
                .FindFirst(ClaimTypes.NameIdentifier)?
                .Value;

            if (string.IsNullOrEmpty(accountIdClaim))
            {
                throw new UnauthorizedAccessException(
                    "Invalid user session.");
            }

            var adminId = Guid.Parse(accountIdClaim);

            var emergencyOverride = await context.EmergencyOverrideRequests
                .FirstOrDefaultAsync(e =>
                    e.EmergencyOverrideId == request.EmergencyOverrideId);

            if (emergencyOverride is null)
            {
                throw new Exception("Emergency Override request not found");
            }

            emergencyOverride.Status = request.Status;
            emergencyOverride.ApprovedById = adminId;
            emergencyOverride.ApprovedAt = DateTime.UtcNow;
            emergencyOverride.OverrideUntil = request.OverrideUntil;

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
            var overrideRequest = await context.EmergencyOverrideRequests
                .FirstOrDefaultAsync(e => e.EmergencyOverrideId == request.EmergencyOverrideId);

            if (overrideRequest == null)
                throw new Exception("Emergency override request not found.");

            if (overrideRequest.Status != "Pending")
                throw new Exception("Only pending requests can be declined.");

            overrideRequest.Status = "Declined";
            overrideRequest.ApprovedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return new EmergencyOverrideResponseDTO
            {
                EmergencyOverrideId = overrideRequest.EmergencyOverrideId,
                RequestedById = overrideRequest.RequestedById,
                LeaveId = overrideRequest.LeaveId,
                Status = overrideRequest.Status,
                Reason = overrideRequest.Reason,
                RequestedAt = overrideRequest.RequestedAt,
                ApprovedAt = overrideRequest.ApprovedAt,
                OverrideUntil = overrideRequest.OverrideUntil
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
    }
}
