using OTMS.Entities.DTOs.AccountManagement;
using OTMS.Entities.DTOs.AccountManagement.Responses;
using OTMS.Entities.DTOs.Pagination.Response;

namespace OTMS.Service.Interfaces
{
    public interface IAccountManagementService
    {
        Task<PaginationResponseDTO<RecentEmployeesResponseDTO>> GetRecentEmployees();
        Task<PaginationResponseDTO<SearchAccountStatusResponseDTO>> GetAccountsByStatus(SearchAccountStatusDTO request);
        Task<SearchUserResponseDTO?> SearchUser(SearchUserDTO request);
        Task<UpdateEmployeeResponseDTO?> UpdateEmployee(string employeeNumber, UpdateEmployeeDTO request);
        Task<DeactivateUserResponseDTO?> DeactivateUser(DeactivateUserDTO request);
        Task<ActivateUserResponseDTO?> ActivateUser(DeactivateUserDTO request);
        Task<AssignUserRoleResponseDTO?> AssignUserRole(AssignUserRoleDTO request);
        Task<DeleteUserResponseDTO?> DeleteUser(DeactivateUserDTO request);
    }
}
