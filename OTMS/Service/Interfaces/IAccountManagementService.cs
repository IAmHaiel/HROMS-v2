using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.AccountManagement;
using OTMS.Entities.DTOs.AccountManagement.Responses;
using OTMS.Entities.DTOs.Pagination;
using OTMS.Entities.DTOs.Pagination.Response;

namespace OTMS.Service.Interfaces
{
    public interface IAccountManagementService
    {
        Task<PaginationResponseDTO<RecentEmployeesResponseDTO>> GetRecentEmployees(PaginationDTO request, string? search, string? role, string? status);
        Task<PaginationResponseDTO<SearchAccountStatusResponseDTO>> GetAccountsByStatus(SearchAccountStatusDTO request);
        Task<SearchUserResponseDTO?> SearchUser(SearchUserDTO request);
        Task<UpdateEmployeeResponseDTO?> UpdateEmployee(string employeeNumber, UpdateEmployeeDTO request);
        Task<DeactivateUserResponseDTO?> DeactivateUser(DeactivateUserDTO request);
        Task<ActivateUserResponseDTO?> ActivateUser(DeactivateUserDTO request);
        Task<AssignUserRoleResponseDTO?> AssignUserRole(AssignUserRoleDTO request);
        Task<DeleteUserResponseDTO?> DeleteUser(DeactivateUserDTO request);
        Task<ApiResponseDTO<Digital201FileResponseDTO>> GetDigital201File(string employeeNumber);
        Task<ApiResponseDTO<EmployeeAttachmentDTO>> UploadEmployeeDocument(string employeeNumber, UploadEmployeeDocumentDTO request);
        Task<ApiResponseDTO<EmployeeAttachmentDTO>> UpdateEmployeeDocument(Guid attachmentId, UpdateEmployeeDocumentDTO request);
        Task<ApiResponseDTO<object>> ArchiveEmployeeDocument(Guid attachmentId);
        Task<ApiResponseDTO<EmployeeAttachmentDTO>> UploadEmploymentContract(string employeeNumber, UploadEmploymentContractDTO request);
        Task<ApiResponseDTO<PaginationResponseDTO<EmploymentContractResponseDTO>>> GetAllEmploymentContracts(PaginationDTO request, string? search, bool? isArchived);
        Task<ApiResponseDTO<string>> UpdateStatutoryRecordsAsync(UpdateStatutoryRecordsDTO request);
        Task<ApiResponseDTO<IEnumerable<StatutorySyncRecordResponseDTO>>> GetStatutorySyncRecordsAsync(string employeeNumber);
    }
}
