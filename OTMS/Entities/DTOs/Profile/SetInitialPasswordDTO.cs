namespace OTMS.Entities.DTOs.Profile
{
    public class SetInitialPasswordDTO
    {
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
