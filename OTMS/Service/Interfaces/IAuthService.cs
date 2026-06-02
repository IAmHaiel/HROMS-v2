using OTMS.Entities.DTOs;
using OTMS.Entities.Models;

namespace OTMS.Service.Interfaces
{
    public interface IAuthService
    {
        Task<EmployeeRegisterResponseDTO?> RegisterAsync(EmployeeRegisterDTO request);
        Task<TokenResponseDTO?> LoginAsync(EmployeeLoginDTO request);
        Task<TokenResponseDTO?> RefreshTokensAsync(RefreshTokenRequestDTO request);
        System.Threading.Tasks.Task ResendVerificationAsync(string employeeNumber);
    }
}
