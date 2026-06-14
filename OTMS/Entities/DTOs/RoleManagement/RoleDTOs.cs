using OTMS.Entities.Models;

namespace OTMS.Entities.DTOs.RoleManagement
{
    public class RoleResponseDTO
    {
        public Guid RoleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsSystemDefined { get; set; }
        public List<string> Permissions { get; set; } = new();
    }

    public class CreateRoleDTO
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> Permissions { get; set; } = new(); // List of Permission Names
    }

    public class UpdateRoleDTO
    {
        public string? Description { get; set; }
        public List<string> Permissions { get; set; } = new();
    }

    public class PermissionResponseDTO
    {
        public Guid PermissionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
