using Microsoft.EntityFrameworkCore;
using OTMS.Data;
using OTMS.Entities.DTOs.RoleManagement;
using OTMS.Entities.Models;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class RolesService(OTMSDbContext context) : IRolesService
    {
        public async Task<List<RoleResponseDTO>> GetAllRolesAsync()
        {
            var roles = await context.Roles
                .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                .ToListAsync();

            return roles.Select(r => new RoleResponseDTO
            {
                RoleId = r.RoleId,
                Name = r.Name,
                Description = r.Description,
                IsSystemDefined = r.IsSystemDefined,
                Permissions = r.RolePermissions.Select(rp => rp.Permission.Name).ToList()
            }).ToList();
        }

        public async Task<RoleResponseDTO?> GetRoleByIdAsync(Guid roleId)
        {
            var role = await context.Roles
                .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(r => r.RoleId == roleId);

            if (role == null) return null;

            return new RoleResponseDTO
            {
                RoleId = role.RoleId,
                Name = role.Name,
                Description = role.Description,
                IsSystemDefined = role.IsSystemDefined,
                Permissions = role.RolePermissions.Select(rp => rp.Permission.Name).ToList()
            };
        }

        public async Task<RoleResponseDTO> CreateRoleAsync(CreateRoleDTO request)
        {
            if (await context.Roles.AnyAsync(r => r.Name == request.Name))
            {
                throw new InvalidOperationException($"Role '{request.Name}' already exists.");
            }

            var newRole = new Role
            {
                RoleId = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                IsSystemDefined = false
            };

            var validPermissions = await context.Permissions
                .Where(p => request.Permissions.Contains(p.Name))
                .ToListAsync();

            foreach (var perm in validPermissions)
            {
                newRole.RolePermissions.Add(new RolePermission
                {
                    RoleId = newRole.RoleId,
                    PermissionId = perm.PermissionId
                });
            }

            context.Roles.Add(newRole);
            await context.SaveChangesAsync();

            return new RoleResponseDTO
            {
                RoleId = newRole.RoleId,
                Name = newRole.Name,
                Description = newRole.Description,
                IsSystemDefined = newRole.IsSystemDefined,
                Permissions = validPermissions.Select(p => p.Name).ToList()
            };
        }

        public async Task<RoleResponseDTO> UpdateRoleAsync(Guid roleId, UpdateRoleDTO request)
        {
            var role = await context.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.RoleId == roleId);

            if (role == null) throw new KeyNotFoundException("Role not found.");

            if (role.IsSystemDefined)
            {
                throw new InvalidOperationException("System defined roles cannot be modified.");
            }

            role.Description = request.Description ?? role.Description;

            // Update permissions
            context.RolePermissions.RemoveRange(role.RolePermissions);

            var validPermissions = await context.Permissions
                .Where(p => request.Permissions.Contains(p.Name))
                .ToListAsync();

            foreach (var perm in validPermissions)
            {
                role.RolePermissions.Add(new RolePermission
                {
                    RoleId = role.RoleId,
                    PermissionId = perm.PermissionId
                });
            }

            await context.SaveChangesAsync();

            return await GetRoleByIdAsync(roleId) ?? throw new Exception("Error retrieving updated role.");
        }

        public async Task<bool> DeleteRoleAsync(Guid roleId)
        {
            var role = await context.Roles.FindAsync(roleId);
            if (role == null) return false;

            if (role.IsSystemDefined)
            {
                throw new InvalidOperationException("System defined roles cannot be deleted.");
            }

            // Check if any users have this role
            if (await context.Accounts.AnyAsync(a => a.RoleId == roleId))
            {
                throw new InvalidOperationException("Cannot delete role because it is assigned to one or more accounts.");
            }

            context.Roles.Remove(role);
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<List<PermissionResponseDTO>> GetAllPermissionsAsync()
        {
            var permissions = await context.Permissions.ToListAsync();
            return permissions.Select(p => new PermissionResponseDTO
            {
                PermissionId = p.PermissionId,
                Name = p.Name,
                Description = p.Description
            }).ToList();
        }
    }
}
