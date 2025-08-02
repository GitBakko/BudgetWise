using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class BalanceSnapshot
{
    public Guid Id { get; set; }

    public string UserId { get; set; } = null!;

    public Guid AccountId { get; set; }

    public DateTimeOffset Date { get; set; }

    public decimal Balance { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual AspNetUser User { get; set; } = null!;
}
