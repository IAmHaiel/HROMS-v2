namespace OTMS.Service.Interfaces
{
    public interface IEmployeeNumberGenerator
    {
        Task<string> GenerateNextEmployeeNumberAsync();
    }
}