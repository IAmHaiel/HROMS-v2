using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace OTMS.Security
{
    public class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
    {
        public PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : base(options)
        {
        }

        public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
        {
            // First, check if the policy is already built-in or registered statically
            var policy = await base.GetPolicyAsync(policyName);

            if (policy == null && policyName.StartsWith("Permissions.", StringComparison.OrdinalIgnoreCase))
            {
                // Dynamically build a policy that requires the requested permission claim
                var policyBuilder = new AuthorizationPolicyBuilder();
                policyBuilder.AddRequirements(new PermissionRequirement(policyName));
                return policyBuilder.Build();
            }

            return policy;
        }
    }
}
