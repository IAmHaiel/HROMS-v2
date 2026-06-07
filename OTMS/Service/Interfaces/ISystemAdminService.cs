using OTMS.Entities.DTOs;

namespace OTMS.Service.Interfaces
{
    public interface ISystemAdminService
    {
        Task<ApiResponseDTO<object>> CreateSystemAdminAccount(SystemAdminCreationDTO request);
        Task CheckSystemAdminExistence(string Email);
    }
}
