class Product {
  int? id;
  String? nombre;
  String? descripcion;
  double precio = 0;
  String? imagenUrl;

  Product({this.id, this.nombre, this.descripcion, this.precio = 0, this.imagenUrl});

  factory Product.fromMap(Map m) {
    return Product(
      id: m['ID_PRODUCTO'] ?? m['id'] ?? m['ID'],
      nombre: m['NOMBRE_PRODUCTO'] ?? m['name'] ?? m['Nombre_producto'],
      descripcion: m['DESCRIPCION'] ?? m['description'],
      precio: ((m['PRECIO'] ?? m['PRECIO_BASE'] ?? m['price'] ?? 0) as num).toDouble(),
      imagenUrl: m['IMAGEN_URL'] ?? m['imagen_url'] ?? m['IMAGEN'] ?? null,
    );
  }
}
