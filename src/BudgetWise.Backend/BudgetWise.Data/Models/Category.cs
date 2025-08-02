using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class Category
{
    public Guid Id { get; set; }

    public string UserId { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Type { get; set; } = null!;

    public string Icon { get; set; } = null!;

    public string? Color { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public virtual AspNetUser User { get; set; } = null!;
}
