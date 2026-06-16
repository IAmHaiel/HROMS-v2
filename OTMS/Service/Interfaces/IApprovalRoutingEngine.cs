using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.Approval;
using OTMS.Entities.DTOs.Approval.Responses;
using OTMS.Entities.DTOs.Dashboard.Responses;

namespace OTMS.Service.Interfaces
{
    public interface IApprovalRoutingEngine
    {
        Task<ApiResponseDTO<ApprovalRequestResponseDTO>> SubmitForApprovalAsync(SubmitApprovalRequestDTO request);

        Task<ApiResponseDTO<ApprovalRequestResponseDTO>> ProcessTierDecisionAsync(Guid approvalRequestId, ApprovalDecisionDTO decision);

        Task<ApiResponseDTO<ApprovalRequestResponseDTO>> GetRequestStatusAsync(Guid approvalRequestId);

        Task<ApiResponseDTO<List<PendingApprovalResponseDTO>>> GetPendingApprovalsAsync(Guid approverAccountId);

        Task<ApiResponseDTO<List<ApprovalRequestResponseDTO>>> GetMyRequestsAsync(Guid requesterAccountId);

        Task<ApiResponseDTO<WorkflowTrackerDTO>> GetTrackerAsync(Guid approvalRequestId);

        Task<ApiResponseDTO<List<WorkflowTrackerDTO>>> GetMyTrackersAsync(Guid requesterAccountId);
    }
}
