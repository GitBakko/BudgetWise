using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class Brand
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string NameLowercase { get; set; } = null!;

    public string? Domain { get; set; }

    public Guid IconId { get; set; }

    public string Color { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; }

    public string CreatedByUid { get; set; } = null!;

    public string CreatedByDisplayName { get; set; } = null!;
}
