using OTMS.Entities.DTOs.EmergencyOverrideRequest;
using OTMS.Entities.DTOs.EmergencyOverrideRequest.Responses;

namespace OTMS.Service.Interfaces
{
    public interface IEmergencyOverrideService
    {
        Task<EmergencyOverrideResponseDTO> RequestOverrideAsync(CreateEmergencyOverrideRequestDTO request);
        Task<EmergencyOverrideResponseDTO> ApproveOverrideAsync(ApproveEmergencyOverrideDTO request);
        Task<EmergencyOverrideResponseDTO> DeclineOverrideAsync(DeclineEmergencyOverrideDTO request);
    }
}
