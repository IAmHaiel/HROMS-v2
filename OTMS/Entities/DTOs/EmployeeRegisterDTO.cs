using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs
{
    public class EmployeeRegisterDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string LastName { get; set; }
        public string? Suffix { get; set; }

        public string Email { get; set; }   
        public string ContactNumber { get; set; }

        public string Role { get; set; }
    }
}
