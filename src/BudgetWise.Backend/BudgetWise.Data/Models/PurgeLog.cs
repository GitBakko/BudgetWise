using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class PurgeLog
{
    public Guid Id { get; set; }

    public DateTimeOffset Timestamp { get; set; }

    public int DeletedCount { get; set; }

    public string? PurgedByUid { get; set; }

    public string? PurgedByDisplayName { get; set; }
}
