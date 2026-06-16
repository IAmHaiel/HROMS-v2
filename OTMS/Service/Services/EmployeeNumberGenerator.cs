using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class EmployeeNumberGenerator(OTMSDbContext context) : IEmployeeNumberGenerator
    {
        public async Task<string> GenerateNextEmployeeNumberAsync()
        {
            var allNumbers = await context.Employees
                .Select(e => e.EmployeeNumber)
                .ToListAsync();

            var maxNumber = allNumbers
                .Where(n => n.Length == 4 && int.TryParse(n, out _))
                .Select(n => int.Parse(n))
                .DefaultIfEmpty(-1)
                .Max();

            var nextNumber = maxNumber + 1;

            if (nextNumber > 9999)
            {
                throw new InvalidOperationException("Employee number range exhausted (max 9999).");
            }

            return nextNumber.ToString("D4");
        }
    }
}