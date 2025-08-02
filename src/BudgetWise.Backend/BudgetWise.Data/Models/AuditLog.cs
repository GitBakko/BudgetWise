using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class AuditLog
{
    public Guid Id { get; set; }

    public DateTimeOffset Timestamp { get; set; }

    public string WhoUid { get; set; } = null!;

    public string WhoRole { get; set; } = null!;

    public string WhoEmail { get; set; } = null!;

    public string OnWhomUid { get; set; } = null!;

    public string? OnWhomDisplayName { get; set; }

    public string Action { get; set; } = null!;

    public string EntityType { get; set; } = null!;

    public string EntityId { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? PreviousState { get; set; }

    public string? NewState { get; set; }

    public DateTimeOffset? RestoredAt { get; set; }

    public string? RestoredByUid { get; set; }

    public string? RestoredByDisplayName { get; set; }
}
