using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class Transaction
{
    public Guid Id { get; set; }

    public string UserId { get; set; } = null!;

    public Guid AccountId { get; set; }

    public string Type { get; set; } = null!;

    public decimal Amount { get; set; }

    public string Description { get; set; } = null!;

    public DateTimeOffset Date { get; set; }

    public string Category { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; }

    public string? Notes { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual AspNetUser User { get; set; } = null!;
}
