namespace OTMS.Entities.DTOs.Profile
{
    public class UpdateInformationDTO
    {
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = null;
        public string LastName { get; set; } = string.Empty;
        public string? Suffix { get; set; } = null;
        public string ContactNumber { get; set; } = string.Empty;

    }
}
