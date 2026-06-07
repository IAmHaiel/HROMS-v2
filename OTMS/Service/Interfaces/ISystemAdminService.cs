using OTMS.Entities.DTOs;

namespace OTMS.Service.Interfaces
{
    public interface ISystemAdminService
    {
        Task<ApiResponseDTO<object>> CreateSystemAdminAccount(string Email, string Password);
        Task CheckSystemAdminExistence(string Email);
    }
}
