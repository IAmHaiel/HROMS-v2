namespace OTMS.Entities.DTOs
{
    public class EmployeeAttachmentDTO
    {
        public Guid EmployeeAttachmentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int Version { get; set; }
    }
}
