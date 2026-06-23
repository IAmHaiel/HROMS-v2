namespace OTMS.Entities.DTOs.Profile.Responses
{
    public class UpdateInformationResponseDTO
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = null;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = null;
        public string ContactNumber { get; set; } = string.Empty;
        public string Email {  get; set; } = string.Empty;

        public DateTime UpdatedAt { get; set; }

        public bool Success { get; set; }

    }
}
