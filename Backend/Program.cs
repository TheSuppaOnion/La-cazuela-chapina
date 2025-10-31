using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Net.Http;
using System.Text.Json;
using DotNetEnv;
using System.Data;
using Oracle.ManagedDataAccess.Client;
using Dapper;
using System.Security.Cryptography;
using System.Text;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Http;

// Función para hashear password con SHA256
string HashPassword(string password)
{
    using var sha256 = SHA256.Create();
    var bytes = Encoding.UTF8.GetBytes(password);
    var hash = sha256.ComputeHash(bytes);
    return Convert.ToBase64String(hash);
}

    

// Cargar variables de entorno desde .env
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

// CORS: permitir frontend (FRONTEND_URL) en desarrollo
var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(p => p.WithOrigins(frontendUrl).AllowAnyHeader().AllowAnyMethod());
});

// Registrar IDbConnection para Oracle usando variables de entorno
builder.Services.AddTransient<IDbConnection>(sp =>
{
    var host = Environment.GetEnvironmentVariable("ORACLE_DB_HOST") ?? "localhost";
    var port = Environment.GetEnvironmentVariable("ORACLE_DB_PORT") ?? "1521";
    var sid = Environment.GetEnvironmentVariable("ORACLE_DB_SID") ?? "XE";
    var user = Environment.GetEnvironmentVariable("ORACLE_DB_USER") ?? "system";
    var pass = Environment.GetEnvironmentVariable("ORACLE_DB_PASS") ?? "oracle";

    var connStr = $"User Id={user};Password={pass};Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={host})(PORT={port}))(CONNECT_DATA=(SID={sid})))";
    return new OracleConnection(connStr);
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Solo usar HTTPS redirection en producción
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors();

app.MapControllers();

// Products endpoints using Dapper and the registered IDbConnection
app.MapGet("/api/products", async (IDbConnection db) =>
{
    try
    {
        const string sql = "SELECT * FROM PRODUCTOS";
        var rows = await db.QueryAsync(sql);
        return Results.Ok(rows);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/api/products/{id}", async (int id, IDbConnection db) =>
{
    try
    {
        const string sql = "SELECT * FROM PRODUCTOS WHERE ID_Producto = :Id";
        var row = await db.QuerySingleOrDefaultAsync(sql, new { Id = id });
        return row is null ? Results.NotFound() : Results.Ok(row);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Update product (Nombre_producto, Precio_base, Atributos)
app.MapPut("/api/products/{id}", async (int id, HttpRequest req, IDbConnection db) =>
{
    try
    {
        var payload = await req.ReadFromJsonAsync<JsonElement>();
        if (payload.ValueKind != JsonValueKind.Object) return Results.BadRequest("Invalid payload");

        var nombre = payload.TryGetProperty("Nombre_producto", out var n) ? n.GetString() : null;
        var precio = payload.TryGetProperty("Precio_base", out var p) && p.ValueKind != JsonValueKind.Null ? p.GetDecimal() : (decimal?)null;
        var atributos = payload.TryGetProperty("Atributos", out var a) ? a.GetString() : null;

        if (string.IsNullOrEmpty(nombre) && precio == null && atributos == null)
            return Results.BadRequest("No fields to update");

        var updates = new List<string>();
        var parameters = new DynamicParameters();
        parameters.Add("Id", id);
        if (!string.IsNullOrEmpty(nombre)) { updates.Add("Nombre_producto = :Nombre"); parameters.Add("Nombre", nombre); }
        if (precio != null) { updates.Add("Precio_base = :Precio"); parameters.Add("Precio", precio); }
        if (atributos != null) { updates.Add("Atributos = :Atributos"); parameters.Add("Atributos", atributos); }

        var sql = $"UPDATE PRODUCTOS SET {string.Join(", ", updates)} WHERE ID_Producto = :Id";
        var affected = await db.ExecuteAsync(sql, parameters);
        return affected > 0 ? Results.Ok(new { success = true }) : Results.NotFound();
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Delete product
app.MapDelete("/api/products/{id}", async (int id, IDbConnection db) =>
{
    try
    {
        const string sql = "DELETE FROM PRODUCTOS WHERE ID_Producto = :Id";
        var affected = await db.ExecuteAsync(sql, new { Id = id });
        return affected > 0 ? Results.Ok(new { success = true }) : Results.NotFound();
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Create product
app.MapPost("/api/products", async (HttpRequest req, IDbConnection db) =>
{
    try
    {
        var payload = await req.ReadFromJsonAsync<JsonElement>();
        if (payload.ValueKind != JsonValueKind.Object) return Results.BadRequest("Invalid payload");

        var nombre = payload.TryGetProperty("Nombre_producto", out var n) ? n.GetString() : null;
        var tipo = payload.TryGetProperty("Tipo_producto", out var t) ? t.GetString() : "producto";
        var precio = payload.TryGetProperty("Precio_base", out var p) && p.ValueKind != JsonValueKind.Null ? p.GetDecimal() : (decimal?)null;
        var personalizable = payload.TryGetProperty("Personalizable", out var per) ? per.GetString() : null;
        var atributos = payload.TryGetProperty("Atributos", out var a) ? a.GetString() : null;
        var disponible = payload.TryGetProperty("Disponible", out var d) ? d.GetString() : null;

        if (string.IsNullOrEmpty(nombre)) return Results.BadRequest("Nombre_producto is required");

        // Try to insert and return the generated ID. This assumes the DB has a trigger or identity
        // that populates ID_Producto, or that RETURNING works in the environment.
        const string sql = @"INSERT INTO PRODUCTOS (Nombre_producto, Tipo_producto, Precio_base, Personalizable, Atributos, Disponible)
            VALUES (:Nombre, :Tipo, :Precio, :Personalizable, :Atributos, :Disponible) RETURNING ID_Producto INTO :NewId";

        var parameters = new DynamicParameters();
        parameters.Add("Nombre", nombre);
        parameters.Add("Tipo", tipo);
        parameters.Add("Precio", precio);
        parameters.Add("Personalizable", personalizable);
        parameters.Add("Atributos", atributos);
        parameters.Add("Disponible", disponible);
        // output parameter for Oracle RETURNING
        parameters.Add("NewId", dbType: System.Data.DbType.Int32, direction: System.Data.ParameterDirection.Output);

        await db.ExecuteAsync(sql, parameters);

        int newId = 0;
        try
        {
            newId = parameters.Get<int>("NewId");
        }
        catch
        {
            // If we can't get the returned id, try to query by a combination (best effort)
            try
            {
                const string lookup = "SELECT ID_Producto FROM PRODUCTOS WHERE Nombre_producto = :Nombre AND ROWNUM = 1 ORDER BY ID_Producto DESC";
                var row = await db.QuerySingleOrDefaultAsync(lookup, new { Nombre = nombre });
                if (row != null)
                {
                    var dict = row as System.Collections.IDictionary;
                    if (dict != null && dict.Contains("ID_Producto")) newId = Convert.ToInt32(dict["ID_Producto"]);
                }
            }
            catch { }
        }

        return Results.Ok(new { success = true, productId = newId });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Upload product image (multipart/form-data) -> stores into BLOB column IMAGEN
app.MapPost("/api/products/{id}/image", async (int id, HttpRequest req, IDbConnection db) =>
{
    try
    {
        if (!req.HasFormContentType) return Results.BadRequest("Invalid content type");

        var form = await req.ReadFormAsync();
        var file = form.Files.FirstOrDefault();
        if (file == null) return Results.BadRequest("No file uploaded");

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var bytes = ms.ToArray();

        const string sql = "UPDATE PRODUCTOS SET IMAGEN = :Img WHERE ID_Producto = :Id";
        await db.ExecuteAsync(sql, new { Img = bytes, Id = id });

        return Results.Ok(new { success = true });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Serve product image as binary (reads BLOB and returns image/*)
app.MapGet("/api/products/{id}/image", async (int id, IDbConnection db) =>
{
    try
    {
        const string sql = "SELECT IMAGEN FROM PRODUCTOS WHERE ID_Producto = :Id";
        var row = await db.QuerySingleOrDefaultAsync(sql, new { Id = id });
        if (row == null) return Results.NotFound();

        // Dapper returns a dynamic object; try to extract the BLOB
    byte[]? bytes = null;
        try
        {
            var dict = row as System.Collections.IDictionary;
                if (dict != null && dict.Contains("IMAGEN"))
                {
                    bytes = dict["IMAGEN"] as byte[];
                }
        }
        catch { }

        if (bytes == null)
        {
            // Try dynamic property safely
            try
            {
                var prop = ((object)row).GetType().GetProperty("IMAGEN");
                if (prop != null)
                {
                    var val = prop.GetValue(row);
                    if (val is byte[] bb) bytes = bb;
                    else if (val is System.Collections.IEnumerable ie)
                    {
                        // try to convert to byte[]
                        var list = new System.Collections.Generic.List<byte>();
                        foreach (var b in ie)
                        {
                            if (b is byte vb) list.Add(vb);
                        }
                        if (list.Count > 0) bytes = list.ToArray();
                    }
                }
            }
            catch { }
        }

        if (bytes == null || bytes.Length == 0) return Results.NotFound();

        // Return generic image content type; browser will auto-detect
        return Results.File(bytes, "application/octet-stream");
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Combos endpoints
app.MapGet("/api/combos", async (IDbConnection db) =>
{
    try
    {
        const string sql = "SELECT * FROM PRODUCTOS WHERE Tipo_producto = 'combo'";
        var rows = await db.QueryAsync(sql);
        return Results.Ok(rows);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/api/combos/{id}", async (int id, IDbConnection db) =>
{
    try
    {
        const string sql = "SELECT * FROM PRODUCTOS WHERE ID_Producto = :Id AND Tipo_producto = 'combo'";
        var row = await db.QuerySingleOrDefaultAsync(sql, new { Id = id });
        return row is null ? Results.NotFound() : Results.Ok(row);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Options for customization
app.MapGet("/api/options", () => Results.Ok(new
{
    masa = new[] { "maíz amarillo", "maíz blanco", "arroz" },
    relleno = new[] { "recado rojo de cerdo", "negro de pollo", "chipilín vegetariano", "mezcla estilo chuchito" },
    envoltura = new[] { "hoja de plátano", "tusa de maíz" },
    picante = new[] { "sin chile", "suave", "chapín" },
    bebidaTipo = new[] { "atol de elote", "atole shuco", "pinol", "cacao batido" },
    endulzante = new[] { "panela", "miel", "sin azúcar" },
    topping = new[] { "malvaviscos", "canela", "ralladura de cacao" }
}));

// Auth endpoints
app.MapPost("/api/auth/login", async (IDbConnection db, HttpRequest req) =>
{
    try
    {
        var payload = await req.ReadFromJsonAsync<JsonElement>();
        if (payload.ValueKind != JsonValueKind.Object) return Results.BadRequest("Invalid payload");

        if (!payload.TryGetProperty("correo_electronico", out var emailProp) || !payload.TryGetProperty("password", out var passProp))
            return Results.BadRequest("Missing fields");

        var correo_electronico = emailProp.GetString();
        var password = passProp.GetString();
        if (string.IsNullOrEmpty(correo_electronico) || string.IsNullOrEmpty(password)) return Results.BadRequest("Invalid fields");

        var hashedPassword = HashPassword(password);
        const string sql = "SELECT * FROM USUARIOS WHERE Correo_usuario = :Email AND Hash_contraseña = :Password";
        var user = await db.QuerySingleOrDefaultAsync(sql, new { Email = correo_electronico, Password = hashedPassword });
        return user is null ? Results.Unauthorized() : Results.Ok(new { success = true, user });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/auth/register", async (IDbConnection db, HttpRequest req) =>
{
    try
    {
        var payload = await req.ReadFromJsonAsync<JsonElement>();
        if (payload.ValueKind != JsonValueKind.Object) return Results.BadRequest("Invalid payload");

        var nombre_usuario = payload.TryGetProperty("name", out var nameP) ? nameP.GetString() : null;
        var correo_electronico = payload.TryGetProperty("email", out var emailP) ? emailP.GetString() : null;
        var nombre_completo = payload.TryGetProperty("name", out var fullP) ? fullP.GetString() : null;
        var password = payload.TryGetProperty("password", out var passP) ? passP.GetString() : null;
        var confirmPassword = payload.TryGetProperty("confirmPassword", out var confP) ? confP.GetString() : null;
        var imagen_perfil = payload.TryGetProperty("profileImage", out var imgP) ? imgP.GetString() : null;

        if (string.IsNullOrEmpty(correo_electronico) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(nombre_completo))
            return Results.BadRequest("Missing required fields");

        // Check if user exists
        const string checkSql = "SELECT COUNT(*) FROM USUARIOS WHERE Correo_usuario = :Email";
        var count = await db.ExecuteScalarAsync<int>(checkSql, new { Email = correo_electronico });
        if (count > 0) return Results.BadRequest("User already exists");

        if (password != confirmPassword) return Results.BadRequest("Passwords do not match");

        // Hash the password
        var hashedPassword = HashPassword(password);

        // Insert new user (usando nombre_completo como Nombre_usuario, agregar defaults)
        const string insertSql = "INSERT INTO USUARIOS (Nombre_usuario, Correo_usuario, Hash_contraseña, Rol, Fecha_creacion) VALUES (:Name, :Email, :Password, 'cliente', SYSDATE)";
        await db.ExecuteAsync(insertSql, new { Name = nombre_completo, Email = correo_electronico, Password = hashedPassword });
        return Results.Ok(new { success = true, message = "User registered" });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// LLM integration with OpenRouter (basic example)
app.MapPost("/api/llm", async (HttpClient httpClient, string prompt) =>
{
    var request = new { model = "openai/gpt-3.5-turbo", messages = new[] { new { role = "user", content = prompt } } };
    var response = await httpClient.PostAsJsonAsync("https://openrouter.ai/api/v1/chat/completions", request);
    var result = await response.Content.ReadFromJsonAsync<JsonElement>();
    return result.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
});

// Aggregated admin analytics endpoint used by the frontend admin panel
app.MapGet("/api/admin/analytics", async (IDbConnection db) =>
{
    try
    {
        const string sqlDaily = "SELECT NVL(SUM(Precio_total), 0) AS total FROM Pedidos WHERE TRUNC(Fecha_pedido) = TRUNC(SYSDATE)";
        var daily = await db.ExecuteScalarAsync<decimal>(sqlDaily);

    // Use TRUNC by month to avoid EXTRACT on DATE/TIMESTAMP differences across Oracle versions
    const string sqlMonthly = "SELECT NVL(SUM(Precio_total), 0) AS total FROM Pedidos WHERE TRUNC(Fecha_pedido,'MM') = TRUNC(SYSDATE,'MM')";
    var monthly = await db.ExecuteScalarAsync<decimal>(sqlMonthly);

        const string sqlTop = @"
            SELECT p.Nombre_producto AS name, COUNT(pp.ID_producto_pedido) AS sales
            FROM Productos_Pedido pp
            JOIN Productos p ON pp.Productos_ID_Producto = p.ID_Producto
            WHERE p.Tipo_producto = 'tamal'
            GROUP BY p.Nombre_producto
            ORDER BY sales DESC
            FETCH FIRST 5 ROWS ONLY";
        var top = await db.QueryAsync(sqlTop);

        // Use TO_CHAR to extract hour from date/timestamp in a safe, portable way
        const string sqlDrinks = @"
            SELECT TO_CHAR(p.Fecha_pedido, 'HH24') AS hour, COUNT(*) AS count
            FROM Pedidos p
            WHERE TRUNC(p.Fecha_pedido) = TRUNC(SYSDATE)
            GROUP BY TO_CHAR(p.Fecha_pedido, 'HH24')
            ORDER BY hour";
        var drinks = await db.QueryAsync(sqlDrinks);

        const string sqlSpicy = "SELECT COUNT(*) FROM PRODUCTOS WHERE Tipo_producto IN ('tamal', 'bebida') AND Atributos LIKE '%picante%'";
        var spicy = await db.ExecuteScalarAsync<int>(sqlSpicy);
        const string sqlNon = "SELECT COUNT(*) FROM PRODUCTOS WHERE Tipo_producto IN ('tamal', 'bebida') AND (Atributos NOT LIKE '%picante%' OR Atributos IS NULL)";
        var nonSpicy = await db.ExecuteScalarAsync<int>(sqlNon);

        const string sqlProfit = @"
            SELECT p.Tipo_producto AS line, SUM(pp.Precio_unitario * pp.Cantidad) AS profit
            FROM Productos_Pedido pp
            JOIN Productos p ON pp.Productos_ID_Producto = p.ID_Producto
            GROUP BY p.Tipo_producto";
        var profit = await db.QueryAsync(sqlProfit);

        return Results.Ok(new
        {
            dailySales = daily,
            monthlySales = monthly,
            topTamales = top,
            drinksBySlot = drinks,
            spicyRatio = new { spicy, nonSpicy },
            profitByLine = profit
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.Run();