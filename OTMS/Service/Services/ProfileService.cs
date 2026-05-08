using OTMS.Data;
using OTMS.Entities.DTOs.Profile;
using OTMS.Entities.DTOs.Profile.Responses;
using OTMS.Service.Interfaces;

namespace OTMS.Service.Services
{
    public class ProfileService(
        OTMSDbContext context
        ) : IProfileService
    {
        public Task<ChangePasswordResponseDTO?> ChangePassword(ChangePasswordDTO request)
        {
            throw new NotImplementedException();
        }

        public Task<UpdateInformationResponseDTO?> UpdateBasicInformation(UpdateInformationDTO request)
        {
            throw new NotImplementedException();
        }

        public Task<ViewProfileResponseDTO?> ViewProfile()
        {
            throw new NotImplementedException();
        }
    }
}
