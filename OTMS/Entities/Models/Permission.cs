namespace OTMS.Entities.Models
{
    public class Permission
    {
        public Guid PermissionId { get; set; }
        public string Name { get; set; } = string.Empty; // e.g., "Permissions.Departments.Create"
        public string Description { get; set; } = string.Empty;

        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}
