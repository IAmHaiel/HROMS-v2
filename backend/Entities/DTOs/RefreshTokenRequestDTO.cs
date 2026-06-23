namespace OTMS.Entities.DTOs
{
    public class RefreshTokenRequestDTO
    {
        public Guid AccountId { get; set; }
        public required string RefreshToken { get; set; }
    }
}
