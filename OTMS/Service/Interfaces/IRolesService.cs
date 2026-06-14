using OTMS.Entities.DTOs.RoleManagement;

namespace OTMS.Service.Interfaces
{
    public interface IRolesService
    {
        Task<List<RoleResponseDTO>> GetAllRolesAsync();
        Task<RoleResponseDTO?> GetRoleByIdAsync(Guid roleId);
        Task<RoleResponseDTO> CreateRoleAsync(CreateRoleDTO request);
        Task<RoleResponseDTO> UpdateRoleAsync(Guid roleId, UpdateRoleDTO request);
        Task<bool> DeleteRoleAsync(Guid roleId);
        Task<List<PermissionResponseDTO>> GetAllPermissionsAsync();
    }
}
