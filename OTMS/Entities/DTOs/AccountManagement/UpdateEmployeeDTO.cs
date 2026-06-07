namespace OTMS.Entities.DTOs.AccountManagement
{
    public class UpdateEmployeeDTO
    {
        public string EmployeeNumber { get; set; } = String.Empty;
        public string FirstName { get; set; } = String.Empty;
        public string? MiddleName { get; set; } = String.Empty;
        public string LastName { get; set; } = String.Empty;
        public string? Suffix { get; set; } = String.Empty;
        public string ContactNumber { get; set; } = String.Empty;
    }
}
