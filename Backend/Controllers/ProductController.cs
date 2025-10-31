using Microsoft.AspNetCore.Mvc;
using LaCazuelaChapina.Models;

namespace LaCazuelaChapina.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    [HttpGet]
    public IEnumerable<Product> Get()
    {
        return new[]
        {
            new Product { Id = 1, Name = "Tamal de Maíz Amarillo", Type = "tamal" },
            new Product { Id = 2, Name = "Atol de Elote", Type = "bebida" }
        };
    }
}