namespace OTMS.Entities.DTOs.Profile
{
    public class ChangePasswordDTO
    {
        public Guid AccountId { get; set; }
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
