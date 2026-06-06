namespace OTMS.Common
{
    public class OnLeaveException(Guid leaveId, string employeeName) : Exception("Your account is currently on leave.")
    {
        public Guid LeaveId { get; } = leaveId;
        public string EmployeeName { get; } = employeeName;
    }
}
