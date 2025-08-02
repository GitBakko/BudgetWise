using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class Notification
{
    public Guid Id { get; set; }

    public string UserId { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public bool IsRead { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public string? RelatedEntityType { get; set; }

    public string? RelatedEntityId { get; set; }

    public virtual AspNetUser User { get; set; } = null!;
}
