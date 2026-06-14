# Integrate Employee Attachments into Services

This plan outlines the steps required to support file uploads for `EmployeeAttachment` across the `AuthService`, `ProfileService`, and `AccountManagementService`. Since handling file uploads requires reading `IFormFile` inputs and writing them to storage, we will also introduce a `FileService`.

## User Review Required

> [!IMPORTANT]
> **File Storage Strategy**: This plan proposes saving uploaded files locally to the `wwwroot/uploads/attachments/` directory within your project. This works great for local development or traditional VPS deployments. However, if you plan to deploy this app to a cloud platform like Azure App Service, Heroku, or AWS Elastic Beanstalk, local files may be wiped out when the server restarts. 
> 
> *Is local storage in `wwwroot` acceptable for your use case, or do you intend to use a cloud storage provider (like Azure Blob Storage or AWS S3)?*

## Open Questions

- When users update their profile/account, should they be able to **delete** existing attachments, or only upload new ones?
- Is there a maximum file size or specific allowed file extensions (like `.pdf`, `.jpg`, `.png`) you want to enforce for security?

## Proposed Changes

### 1. DTO Updates (`e:\Capstone Project\Capstone\OTMS\OTMS\Entities\DTOs\`)

We need to modify the input DTOs to accept files and response DTOs to return file data.

- **[MODIFY]** `EmployeeRegisterDTO.cs`: Add `public List<IFormFile>? Attachments { get; set; }`
- **[MODIFY]** `UpdateInformationDTO.cs`: Add `public List<IFormFile>? Attachments { get; set; }`
- **[MODIFY]** `UpdateEmployeeDTO.cs`: Add `public List<IFormFile>? Attachments { get; set; }`
- **[NEW]** `EmployeeAttachmentDTO.cs`: A new DTO to send attachment data back to the client.
```csharp
public class EmployeeAttachmentDTO
{
    public Guid EmployeeAttachmentId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
}
```
- **[MODIFY]** `ViewProfileResponseDTO.cs` & `SearchUserResponseDTO.cs`: Add `public List<EmployeeAttachmentDTO>? Attachments { get; set; }`

### 2. Common / Helper layer (`e:\Capstone Project\Capstone\OTMS\OTMS\Service\Helper\`)

- **[NEW]** `FileService.cs` & `IFileService.cs`: A dedicated service to handle the complex logic of writing an `IFormFile` to `wwwroot`, generating unique file names to avoid collisions, and generating the URL for retrieval.
- Register `IFileService` in `Program.cs`.

### 3. Service Integrations (`e:\Capstone Project\Capstone\OTMS\OTMS\Service\Services\`)

#### [MODIFY] `AuthService.cs`
- In `RegisterAsync`: After creating the `Employee` object, if the `request.Attachments` is not null, use `IFileService` to save the files, map them into `EmployeeAttachment` entities, and attach them to `employee.Attachments`.

#### [MODIFY] `ProfileService.cs`
- In `UpdateBasicInformation`: Allow appending new files from `request.Attachments`.
- In `ViewProfile`: Add `.Include(e => e.Attachments)` to the query and map the attachments to the response DTO.

#### [MODIFY] `AccountManagementService.cs`
- In `UpdateEmployee`: Similar to ProfileService, allow appending new files from `request.Attachments`.
- In `SearchUser` and potentially `GetAccountsByStatus`/`GetRecentEmployees`: Include the attachments in the query if needed by the frontend.

## Verification Plan

### Automated Tests
- *(If applicable)* Run existing unit/integration tests to ensure no regressions.

### Manual Verification
1. Open Swagger / Postman.
2. Call the **Register** endpoint using `multipart/form-data` instead of JSON to allow file uploads. Verify the files are saved in `wwwroot`.
3. Call **ViewProfile** and ensure the attachment URLs are correctly returned.
4. Call **UpdateBasicInformation** to add another file and verify the list grows.
