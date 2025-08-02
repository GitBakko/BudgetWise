using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class DefaultCategory
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string Type { get; set; } = null!;

    public string Icon { get; set; } = null!;

    public string? Color { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public string CreatedByUid { get; set; } = null!;

    public string CreatedByDisplayName { get; set; } = null!;
}
