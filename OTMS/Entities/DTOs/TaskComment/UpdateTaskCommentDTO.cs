using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.TaskComment
{
    public class UpdateTaskCommentDTO
    {
        [Required(ErrorMessage = "Comment content is required.")]
        [MaxLength(1000, ErrorMessage = "Comment content cannot exceed 1000 characters.")]
        public string Message { get; set; } = string.Empty;
    }
}
