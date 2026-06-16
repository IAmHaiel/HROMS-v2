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
                "Permissions.Approvals.View",
                "Permissions.Approvals.Submit",
                "Permissions.Approvals.Process",
                "Permissions.Approvals.Manage",
                "Permissions.Recruitment.View",
                "Permissions.Recruitment.Manage",
                "Permissions.Dashboard.View",
                "Permissions.Reporting.View",
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
            var hrAdminRoleName = "HRAdmin";

            var rolesToCreate = new[] { systemAdminRoleName, operationAdminRoleName, coordinatorRoleName, encoderRoleName, hrAdminRoleName };

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
            var hrAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == hrAdminRoleName);

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
                    p.Name.StartsWith("Permissions.Approvals.") ||
                    p.Name.StartsWith("Permissions.Departments.View") ||
                    p.Name.StartsWith("Permissions.JobPositions.View") ||
                    p.Name.StartsWith("Permissions.Dashboard.") ||
                    p.Name.StartsWith("Permissions.Reporting."));

                foreach (var perm in opPermissions)
                {
                    if (!await context.RolePermissions.AnyAsync(rp => rp.RoleId == operationAdminRole.RoleId && rp.PermissionId == perm.PermissionId))
                    {
                        context.RolePermissions.Add(new RolePermission { RoleId = operationAdminRole.RoleId, PermissionId = perm.PermissionId });
                    }
                }
            }

            if (hrAdminRole != null)
            {
                // HR Admin gets Recruitment permissions
                var hrPermissions = allDbPermissions.Where(p =>
                    p.Name.StartsWith("Permissions.Recruitment."));

                foreach (var perm in hrPermissions)
                {
                    if (!await context.RolePermissions.AnyAsync(rp => rp.RoleId == hrAdminRole.RoleId && rp.PermissionId == perm.PermissionId))
                    {
                        context.RolePermissions.Add(new RolePermission { RoleId = hrAdminRole.RoleId, PermissionId = perm.PermissionId });
                    }
                }
            }

            await context.SaveChangesAsync();

            // 4. Seed Default Approval Routing Matrices
            await SeedApprovalRoutingMatricesAsync(context);
        }

        private static async System.Threading.Tasks.Task SeedApprovalRoutingMatricesAsync(OTMSDbContext context)
        {
            // Leave Request Routing Matrix (Employee -> Supervisor -> HR Admin)
            if (!await context.ApprovalRoutingMatrices.AnyAsync(m => m.RequestType == "Leave"))
            {
                var leaveMatrix = new ApprovalRoutingMatrix
                {
                    RoutingMatrixId = Guid.NewGuid(),
                    RequestType = "Leave",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                leaveMatrix.Tiers = new List<ApprovalTier>
                {
                    new ApprovalTier
                    {
                        TierId = Guid.NewGuid(),
                        RoutingMatrixId = leaveMatrix.RoutingMatrixId,
                        TierLevel = 1,
                        ApproverRole = "Supervisor",
                        FallbackApproverRole = "OperationAdmin",
                        IsFinalTier = false,
                        CreatedAt = DateTime.UtcNow
                    },
                    new ApprovalTier
                    {
                        TierId = Guid.NewGuid(),
                        RoutingMatrixId = leaveMatrix.RoutingMatrixId,
                        TierLevel = 2,
                        ApproverRole = "OperationAdmin",
                        IsFinalTier = true,
                        CreatedAt = DateTime.UtcNow
                    }
                };

                context.ApprovalRoutingMatrices.Add(leaveMatrix);
            }

            // Asset Request Routing Matrix
            if (!await context.ApprovalRoutingMatrices.AnyAsync(m => m.RequestType == "Asset"))
            {
                var assetMatrix = new ApprovalRoutingMatrix
                {
                    RoutingMatrixId = Guid.NewGuid(),
                    RequestType = "Asset",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                assetMatrix.Tiers = new List<ApprovalTier>
                {
                    new ApprovalTier
                    {
                        TierId = Guid.NewGuid(),
                        RoutingMatrixId = assetMatrix.RoutingMatrixId,
                        TierLevel = 1,
                        ApproverRole = "Supervisor",
                        FallbackApproverRole = "OperationAdmin",
                        IsFinalTier = false,
                        CreatedAt = DateTime.UtcNow
                    },
                    new ApprovalTier
                    {
                        TierId = Guid.NewGuid(),
                        RoutingMatrixId = assetMatrix.RoutingMatrixId,
                        TierLevel = 2,
                        ApproverRole = "OperationAdmin",
                        IsFinalTier = true,
                        CreatedAt = DateTime.UtcNow
                    }
                };

                context.ApprovalRoutingMatrices.Add(assetMatrix);
            }

            // Resignation Request Routing Matrix
            if (!await context.ApprovalRoutingMatrices.AnyAsync(m => m.RequestType == "Resignation"))
            {
                var resignMatrix = new ApprovalRoutingMatrix
                {
                    RoutingMatrixId = Guid.NewGuid(),
                    RequestType = "Resignation",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                resignMatrix.Tiers = new List<ApprovalTier>
                {
                    new ApprovalTier
                    {
                        TierId = Guid.NewGuid(),
                        RoutingMatrixId = resignMatrix.RoutingMatrixId,
                        TierLevel = 1,
                        ApproverRole = "Supervisor",
                        FallbackApproverRole = "OperationAdmin",
                        IsFinalTier = false,
                        CreatedAt = DateTime.UtcNow
                    },
                    new ApprovalTier
                    {
                        TierId = Guid.NewGuid(),
                        RoutingMatrixId = resignMatrix.RoutingMatrixId,
                        TierLevel = 2,
                        ApproverRole = "OperationAdmin",
                        IsFinalTier = true,
                        CreatedAt = DateTime.UtcNow
                    }
                };

                context.ApprovalRoutingMatrices.Add(resignMatrix);
            }

            // e-NTE (Notice to Explain) Routing Matrix
            if (!await context.ApprovalRoutingMatrices.AnyAsync(m => m.RequestType == "e-NTE"))
            {
                var nteMatrix = new ApprovalRoutingMatrix
                {
                    RoutingMatrixId = Guid.NewGuid(),
                    RequestType = "e-NTE",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    Tiers = new List<ApprovalTier>
                    {
                        new ApprovalTier
                        {
                            TierId = Guid.NewGuid(),
                            TierLevel = 1,
                            ApproverRole = "Supervisor",
                            FallbackApproverRole = "OperationAdmin",
                            IsFinalTier = false,
                            CreatedAt = DateTime.UtcNow
                        },
                        new ApprovalTier
                        {
                            TierId = Guid.NewGuid(),
                            TierLevel = 2,
                            ApproverRole = "OperationAdmin",
                            IsFinalTier = true,
                            CreatedAt = DateTime.UtcNow
                        }
                    }
                };
                context.ApprovalRoutingMatrices.Add(nteMatrix);
            }

            // Offboarding Routing Matrix
            if (!await context.ApprovalRoutingMatrices.AnyAsync(m => m.RequestType == "Offboarding"))
            {
                var offboardMatrix = new ApprovalRoutingMatrix
                {
                    RoutingMatrixId = Guid.NewGuid(),
                    RequestType = "Offboarding",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    Tiers = new List<ApprovalTier>
                    {
                        new ApprovalTier
                        {
                            TierId = Guid.NewGuid(),
                            TierLevel = 1,
                            ApproverRole = "Supervisor",
                            FallbackApproverRole = "OperationAdmin",
                            IsFinalTier = false,
                            CreatedAt = DateTime.UtcNow
                        },
                        new ApprovalTier
                        {
                            TierId = Guid.NewGuid(),
                            TierLevel = 2,
                            ApproverRole = "OperationAdmin",
                            IsFinalTier = true,
                            CreatedAt = DateTime.UtcNow
                        }
                    }
                };
                context.ApprovalRoutingMatrices.Add(offboardMatrix);
            }

            await context.SaveChangesAsync();
        }
    }
}
