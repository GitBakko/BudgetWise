using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class ImageFile
{
    public Guid Id { get; set; }

    public string OriginalName { get; set; } = null!;

    public string UniqueName { get; set; } = null!;

    public string StoragePath { get; set; } = null!;

    public DateTimeOffset UploadDate { get; set; }

    public long FileSizeBytes { get; set; }

    public string ContentType { get; set; } = null!;

    public string UserId { get; set; } = null!;

    public bool IsAnalyzed { get; set; }

    public DateTimeOffset? LastAnalyzedAt { get; set; }

    public virtual AspNetUser User { get; set; } = null!;
}
