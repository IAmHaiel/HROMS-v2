using OTMS.Entities.DTOs;
using OTMS.Entities.DTOs.EmergencyOverrideRequest;
using OTMS.Entities.DTOs.EmergencyOverrideRequest.Responses;

namespace OTMS.Service.Interfaces
{
    public interface IEmergencyOverrideService
    {
        Task<EmergencyOverrideResponseDTO> RequestOverrideAsync(CreateEmergencyOverrideRequestDTO request);
        Task<ApiResponseDTO<object>> DeleteEmergencyOverrideAsync(Guid EmergencyOverrideId);
        Task<UpdateEmergencyOverrideDTO> UpdateEmergencyOverrideAsync(UpdateEmergencyOverrideDTO request);
        Task<EmergencyOverrideResponseDTO> ApproveOverrideAsync(ApproveEmergencyOverrideDTO request);
        Task<EmergencyOverrideResponseDTO> DeclineOverrideAsync(DeclineEmergencyOverrideDTO request);
    }
}
