using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs
{
    public class EmployeeRegisterDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public List<Microsoft.AspNetCore.Http.IFormFile>? Attachments { get; set; }
    }
}
