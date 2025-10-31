namespace LaCazuelaChapina.Models;

public class Sale
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public List<SaleItem> Items { get; set; } = new();
    public decimal Total { get; set; }
}

public class SaleItem
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}