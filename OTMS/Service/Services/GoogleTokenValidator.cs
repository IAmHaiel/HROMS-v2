using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class GoogleTokenValidator : IGoogleTokenValidator
    {
        private readonly string _googleClientId;

        public GoogleTokenValidator(IConfiguration configuration)
        {
            _googleClientId = configuration["GoogleAuth:ClientId"] ?? string.Empty;
            Console.WriteLine($"GoogleTokenValidator initialized with ClientId: '{_googleClientId}'");
        }

        public async Task<string> ValidateTokenAndGetEmailAsync(string googleToken)
        {
            Console.WriteLine($"Validating Google token (length: {googleToken?.Length})");
            try
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(googleToken, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _googleClientId },
                    IssuedAtClockTolerance = TimeSpan.FromMinutes(5),
                    ExpirationTimeClockTolerance = TimeSpan.FromMinutes(5)
                });
                Console.WriteLine($"Token valid, email: {payload.Email}, audience: {payload.Audience}");
                return payload.Email;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Google token validation FAILED: {ex.GetType().Name}: {ex.Message}");
                throw;
            }
        }
    }
}
