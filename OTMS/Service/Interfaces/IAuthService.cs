using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.PasswordVerification;
using OTMS.Entities.DTOs.PasswordVerification.Response;
using OTMS.Entities.DTOs.ResetPassword;
using OTMS.Entities.Models;

namespace OTMS.Service.Interfaces
{
    public interface IAuthService
    {
        Task<EmployeeRegisterResponseDTO?> RegisterAsync(EmployeeRegisterDTO request);
        Task<TokenResponseDTO?> LoginAsync(EmployeeLoginDTO request);
        Task<TokenResponseDTO?> RefreshTokensAsync(RefreshTokenRequestDTO request);
        System.Threading.Tasks.Task ResendVerificationAsync(string employeeNumber);
        Task<PasswordVerificationResponseDTO> VerifyPasswordAsync(PasswordVerificationDTO request);
        Task<ApiResponseDTO<object>> ForgotPasswordAsync(ForgotPasswordDTO request);
        Task<ApiResponseDTO<object>> ResetPasswordAsync(ResetPasswordDTO request);
    }
}
