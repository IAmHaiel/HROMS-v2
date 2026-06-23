using OTMS.Entities.DTOs.Task.Responses;
using System;
using System.Collections.Generic;

namespace OTMS.Common.Exceptions
{
    /// <summary>
    /// Custom exception thrown when potential duplicate tasks are detected during creation.
    /// Contains a list of DuplicateTaskWarningDTO objects with similarity details.
    /// </summary>
    public class DuplicateTaskException : Exception
    {
        public List<DuplicateTaskWarningDTO> Duplicates { get; }

        public DuplicateTaskException(List<DuplicateTaskWarningDTO> duplicates)
            : base("Potential duplicate task detected.")
        {
            Duplicates = duplicates;
        }
    }
}
