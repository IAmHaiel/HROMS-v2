using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace OTMS.Security
{
    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            if (context.User == null)
            {
                return Task.CompletedTask;
            }

            // We check if the user has a claim of type "Permission" that matches the requirement
            var permissions = context.User.Claims
                .Where(x => x.Type == "Permission")
                .Select(x => x.Value);

            if (permissions.Contains(requirement.Permission))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            return Task.CompletedTask;
        }
    }
}
