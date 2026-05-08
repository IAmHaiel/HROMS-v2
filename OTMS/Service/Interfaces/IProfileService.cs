using OTMS.Entities.DTOs.Profile;
using OTMS.Entities.DTOs.Profile.Responses;

namespace OTMS.Service.Interfaces
{
    public interface IProfileService
    {
        // View Profile
        Task<ViewProfileResponseDTO?> ViewProfile();
        // Update Basic Information
        Task<UpdateInformationResponseDTO?> UpdateBasicInformation(UpdateInformationDTO request);
        // Change Password
        Task<ChangePasswordResponseDTO?> ChangePassword(ChangePasswordDTO request);
    }
}
