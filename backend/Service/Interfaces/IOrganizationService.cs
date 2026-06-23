using OTMS.Entities.DTOs.Organization;

namespace OTMS.Service.Interfaces
{
    public interface IOrganizationService
    {
        Task<List<DepartmentResponseDTO>> GetAllDepartmentsAsync();
        Task<DepartmentResponseDTO> CreateDepartmentAsync(CreateDepartmentDTO request);
        Task<DepartmentResponseDTO> UpdateDepartmentAsync(Guid id, CreateDepartmentDTO request);
        Task<bool> DeleteDepartmentAsync(Guid id);

        Task<List<JobPositionResponseDTO>> GetAllJobPositionsAsync();
        Task<List<JobPositionResponseDTO>> GetJobPositionsByDepartmentAsync(Guid departmentId);
        Task<JobPositionResponseDTO> CreateJobPositionAsync(CreateJobPositionDTO request);
        Task<JobPositionResponseDTO> UpdateJobPositionAsync(Guid id, CreateJobPositionDTO request);
        Task<bool> DeleteJobPositionAsync(Guid id);
    }
}
