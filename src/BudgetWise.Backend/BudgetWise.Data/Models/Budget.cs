using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class Budget
{
    public Guid Id { get; set; }

    public string UserId { get; set; } = null!;

    public string Name { get; set; } = null!;

    public decimal Amount { get; set; }

    public string Currency { get; set; } = null!;

    public string CategoryIds { get; set; } = null!;

    public DateTimeOffset StartDate { get; set; }

    public DateTimeOffset EndDate { get; set; }

    public string Periodicity { get; set; } = null!;

    public bool IsActive { get; set; }

    public decimal SpentAmount { get; set; }

    public decimal ProgressPercentage { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public virtual AspNetUser User { get; set; } = null!;
}
