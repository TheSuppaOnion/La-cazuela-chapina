namespace LaCazuelaChapina.Models;

public class Combo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<ComboItem> Items { get; set; } = new();
    public decimal Price { get; set; }
}

public class ComboItem
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
}