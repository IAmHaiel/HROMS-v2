using Google.Apis.Auth;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class GoogleTokenValidator : IGoogleTokenValidator
    {
        public async Task<string> ValidateTokenAndGetEmailAsync(string googleToken)
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(googleToken);
            return payload.Email;
        }
    }
}
