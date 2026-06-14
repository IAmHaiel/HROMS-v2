using Microsoft.EntityFrameworkCore;
using OTMS.Common.Constraints;
using OTMS.Entities.Models;

namespace OTMS.Data
{
    public static class DatabaseSeeder
    {
        public static async System.Threading.Tasks.Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<OTMSDbContext>();

            // Ensure database is created (or migrated)
            await context.Database.MigrateAsync();

            // 1. Seed Permissions
            var permissions = new List<string>
            {
                "Permissions.SystemAdmin.FullAccess",
                "Permissions.Users.View",
                "Permissions.Users.Manage",
                "Permissions.Roles.View",
                "Permissions.Roles.Manage",
                "Permissions.Departments.View",
                "Permissions.Departments.Manage",
                "Permissions.JobPositions.View",
                "Permissions.JobPositions.Manage",
                "Permissions.Tasks.View",
                "Permissions.Tasks.Manage",
                // add more as needed
            };

            foreach (var perm in permissions)
            {
                if (!await context.Permissions.AnyAsync(p => p.Name == perm))
                {
                    context.Permissions.Add(new Permission
                    {
                        PermissionId = Guid.NewGuid(),
                        Name = perm,
                        Description = $"Allows {perm.Split('.').Last()} operations on {perm.Split('.')[1]}"
                    });
                }
            }
            await context.SaveChangesAsync();

            // 2. Seed Default Roles
            var systemAdminRoleName = "SystemAdmin";
            var operationAdminRoleName = "OperationAdmin";
            var coordinatorRoleName = "Coordinator";
            var encoderRoleName = "Encoder";

            var rolesToCreate = new[] { systemAdminRoleName, operationAdminRoleName, coordinatorRoleName, encoderRoleName };

            foreach (var roleName in rolesToCreate)
            {
                if (!await context.Roles.AnyAsync(r => r.Name == roleName))
                {
                    context.Roles.Add(new Role
                    {
                        RoleId = Guid.NewGuid(),
                        Name = roleName,
                        Description = $"System default role for {roleName}",
                        IsSystemDefined = true
                    });
                }
            }
            await context.SaveChangesAsync();

            // 3. Assign Permissions to Roles
            var systemAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == systemAdminRoleName);
            var operationAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == operationAdminRoleName);

            var allDbPermissions = await context.Permissions.ToListAsync();

            if (systemAdminRole != null)
            {
                // System Admin gets ALL permissions
                foreach (var perm in allDbPermissions)
                {
                    if (!await context.RolePermissions.AnyAsync(rp => rp.RoleId == systemAdminRole.RoleId && rp.PermissionId == perm.PermissionId))
                    {
                        context.RolePermissions.Add(new RolePermission { RoleId = systemAdminRole.RoleId, PermissionId = perm.PermissionId });
                    }
                }
            }

            if (operationAdminRole != null)
            {
                // Operation Admin gets a subset (example: can manage tasks, users, but not roles)
                var opPermissions = allDbPermissions.Where(p => 
                    p.Name.StartsWith("Permissions.Tasks.") || 
                    p.Name.StartsWith("Permissions.Users.") ||
                    p.Name.StartsWith("Permissions.Departments.View") ||
                    p.Name.StartsWith("Permissions.JobPositions.View"));

                foreach (var perm in opPermissions)
                {
                    if (!await context.RolePermissions.AnyAsync(rp => rp.RoleId == operationAdminRole.RoleId && rp.PermissionId == perm.PermissionId))
                    {
                        context.RolePermissions.Add(new RolePermission { RoleId = operationAdminRole.RoleId, PermissionId = perm.PermissionId });
                    }
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
