using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Approval
{
    public class CancelApprovalRequestDTO
    {
        [MaxLength(500)]
        public string? Reason { get; set; }
    }
}
