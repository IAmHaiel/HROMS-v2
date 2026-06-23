namespace OTMS.Entities.Models
{
    public class Role
    {
        public Guid RoleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        public bool IsSystemDefined { get; set; } = false; // Indicates if the role is a core un-deletable role (e.g. SystemAdmin)

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
        public ICollection<Account> Accounts { get; set; } = new List<Account>();
    }
}
