using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.Approval
{
    public class SubmitApprovalRequestDTO
    {
        [Required(ErrorMessage = "Request Type is required.")]
        public string RequestType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Source Entity Type is required.")]
        public string SourceEntityType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Source Entity ID is required.")]
        public Guid SourceEntityId { get; set; }
    }
}
