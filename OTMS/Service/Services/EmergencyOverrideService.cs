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

        public async Task<EmergencyOverrideResponseDTO> RequestOverrideAsync(CreateEmergencyOverrideRequestDTO request)
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

            var accountId = Guid.Parse(accountIdClaim);

            var leaveRequest = await context.LeaveRequests
                .FirstOrDefaultAsync(lr =>
                    lr.LeaveId == request.LeaveId &&
                    lr.AccountId == accountId &&
                    lr.Approval_Status == "Approved");

            if (leaveRequest is null)
            {
                throw new Exception("You can only request emergency override for approved leave requests.");
            }

            var emergencyOverride = new EmergencyOverrideRequest
            {
                RequestedById = accountId,
                LeaveId = request.LeaveId,
                Reason = request.Reason,
                Status = "Pending"
            };

            context.EmergencyOverrideRequests
                .Add(emergencyOverride);

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
