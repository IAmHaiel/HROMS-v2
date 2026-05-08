using OTMS.Entities.DTOs.AccountManagement;
using OTMS.Entities.DTOs.AccountManagement.Responses;

namespace OTMS.Service.Interfaces
{
    public interface IAccountManagementService
    {
        Task<DeactivateUserResponseDTO?> DeactivateUser(DeactivateUserDTO request);
        Task<ActivateUserResponseDTO?> ActivateUser(DeactivateUserDTO request);
        Task<AssignUserRoleResponseDTO?> AssignUserRole(AssignUserRoleDTO request);
        Task<DeleteUserResponseDTO?> DeleteUser(DeactivateUserDTO request);
    }
}
