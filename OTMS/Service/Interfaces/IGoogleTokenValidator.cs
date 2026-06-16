namespace OTMS.Service.Interfaces
{
    public interface IGoogleTokenValidator
    {
        Task<string> ValidateTokenAndGetEmailAsync(string googleToken);
    }
}
