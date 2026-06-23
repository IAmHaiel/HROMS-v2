using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace OTMS.Entities.DTOs.TaskComment
{
    public class CreateTaskCommentDTO
    {
        [Required]
        public Guid TaskId { get; set; }

        [Required(ErrorMessage = "Comment content is required.")]
        [MaxLength(1000, ErrorMessage = "Comment content cannot exceed 1000 characters.")]
        public string Message { get; set; } = string.Empty;

        // Optional, PDF, DOCX, XLSX, JPG, PNG; max 20MB
        public IFormFile? Attachment { get; set; }
    }
}
