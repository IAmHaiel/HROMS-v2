using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class EmployeeService(OTMSDbContext context) : IEmployeeService
    {
        public async Task<Employee?> GetEmployeeByEmployeeNumberAsync(string employeeNumber)
        {
            return await context.Employees
                .Include(e => e.Account)
                .FirstOrDefaultAsync(e => 
                    e.EmployeeNumber == employeeNumber);
        }
    }
}
