using System;
using System.Collections.Generic;

namespace BudgetWise.Data.Models;

public partial class Account
{
    public Guid Id { get; set; }

    public string UserId { get; set; } = null!;

    public string Name { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset BalanceStartDate { get; set; }

    public Guid? IconId { get; set; }

    public string? Color { get; set; }

    public virtual ICollection<AspNetUser> AspNetUsers { get; set; } = new List<AspNetUser>();

    public virtual ICollection<BalanceSnapshot> BalanceSnapshots { get; set; } = new List<BalanceSnapshot>();

    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    public virtual AspNetUser User { get; set; } = null!;
}
