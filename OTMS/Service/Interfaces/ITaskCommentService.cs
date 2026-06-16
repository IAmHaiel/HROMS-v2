using OTMS.Entities.DTOs.TaskComment;
using OTMS.Entities.DTOs.TaskComment.Responses;

namespace OTMS.Service.Interfaces
{
    public interface ITaskCommentService
    {
        Task<TaskCommentResponseDTO> CreateCommentAsync(CreateTaskCommentDTO request);
        Task<TaskCommentResponseDTO> UpdateCommentAsync(Guid commentId, UpdateTaskCommentDTO request);
        Task<bool> DeleteCommentAsync(Guid commentId);
        Task<IEnumerable<TaskCommentResponseDTO>> GetCommentsByTaskAsync(Guid taskId);
    }
}
