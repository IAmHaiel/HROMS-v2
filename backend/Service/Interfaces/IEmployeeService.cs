using OTMS.Entities.Models;

namespace OTMS.Service.Interfaces
{
    public interface IEmployeeService
    {
        Task<Employee?> GetEmployeeByEmployeeNumberAsync(string employeeNumber);
    }
}
