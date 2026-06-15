using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class FileService(IWebHostEnvironment environment, IHttpContextAccessor httpContextAccessor, OTMSDbContext context) : IFileService
    {
        public async Task<EmployeeAttachment> SaveFileAsync(IFormFile file, Guid employeeId)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty.");

            long maxSize = 100L * 1024 * 1024; // 100 MB

            if (file.Length > maxSize)
                throw new ArgumentException($"File size must be less than 100MB. Current size is {file.Length / (1024 * 1024.0):F2}MB.");

            // Create uploads directory if it doesn't exist
            var uploadsFolder = Path.Combine(environment.WebRootPath, "uploads", "attachments");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Generate unique filename
            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Save file to disk
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Generate URL for the file
            var request = httpContextAccessor.HttpContext?.Request;
            var baseUrl = $"{request?.Scheme}://{request?.Host}";
            var fileUrl = $"{baseUrl}/uploads/attachments/{uniqueFileName}";

            // Calculate Version
            var maxVersion = await context.EmployeeAttachments
                .Where(ea => ea.EmployeeId == employeeId && ea.FileName == file.FileName)
                .MaxAsync(ea => (int?)ea.Version) ?? 0;

            return new EmployeeAttachment
            {
                EmployeeAttachmentId = Guid.NewGuid(),
                EmployeeId = employeeId,
                FileName = file.FileName,
                FilePath = fileUrl,
                ContentType = file.ContentType,
                FileSize = file.Length,
                Version = maxVersion + 1,
                UploadedAt = DateTime.UtcNow
            };
        }

        public async Task<string> UploadFileAsync(IFormFile file, string subfolder)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty.");

            long maxSize = 20L * 1024 * 1024; // 20 MB as requested by tasks
            if (file.Length > maxSize)
                throw new ArgumentException($"File size must be less than 20MB. Current size is {file.Length / (1024 * 1024.0):F2}MB.");

            var uploadsFolder = Path.Combine(environment.WebRootPath, "uploads", subfolder);
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var request = httpContextAccessor.HttpContext?.Request;
            var baseUrl = $"{request?.Scheme}://{request?.Host}";
            return $"{baseUrl}/uploads/{subfolder}/{uniqueFileName}";
        }

        public void DeleteFile(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl)) return;

            try
            {
                var uri = new Uri(fileUrl);
                var filePath = Path.Combine(environment.WebRootPath, uri.AbsolutePath.TrimStart('/'));
                filePath = filePath.Replace('/', Path.DirectorySeparatorChar);

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }
            catch (Exception)
            {
                // Log exception if necessary
            }
        }
    }
}
