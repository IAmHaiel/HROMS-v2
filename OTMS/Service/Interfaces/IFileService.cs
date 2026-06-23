using Microsoft.AspNetCore.Http;
using OTMS.Entities.Models;

namespace OTMS.Service.Interfaces
{
    public interface IFileService
    {
        Task<EmployeeAttachment> SaveFileAsync(IFormFile file, Guid employeeId);
        Task<string> UploadFileAsync(IFormFile file, string subfolder);
        void DeleteFile(string fileUrl);
    }
}
