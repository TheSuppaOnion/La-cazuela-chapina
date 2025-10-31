namespace LaCazuelaChapina.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "tamal" or "bebida"

    // Atributos para tamales
    public string? Masa { get; set; } // maíz amarillo, maíz blanco, arroz
    public string? Relleno { get; set; } // recado rojo de cerdo, negro de pollo, chipilín vegetariano, mezcla estilo chuchito
    public string? Envoltura { get; set; } // hoja de plátano, tusa de maíz
    public string? Picante { get; set; } // sin chile, suave, chapín

    // Atributos para bebidas
    public string? BebidaTipo { get; set; } // atol de elote, atole shuco, pinol, cacao batido
    public string? Endulzante { get; set; } // panela, miel, sin azúcar
    public string? Topping { get; set; } // malvaviscos, canela, ralladura de cacao
}