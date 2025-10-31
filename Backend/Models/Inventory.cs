namespace LaCazuelaChapina.Models;

public class Inventory
{
    public int Id { get; set; }
    public string Item { get; set; } = string.Empty; // masa, hojas, proteínas, granos, endulzantes, especias, empaques, combustible
    public decimal Quantity { get; set; }
    public decimal Cost { get; set; }
    public DateTime LastUpdated { get; set; }
}