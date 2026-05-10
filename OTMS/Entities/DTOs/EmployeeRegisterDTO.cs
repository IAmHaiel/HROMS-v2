using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs
{
    public class EmployeeRegisterDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;

        public string EmployeeName { get; set; }

        public string ContactNumber { get; set; }

        public string Role { get; set; }
    }
}
