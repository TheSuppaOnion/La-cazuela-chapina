import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiService {
  static final String _base = dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:5000/api';

  static Future<List<dynamic>> fetchProducts() async {
    final res = await http.get(Uri.parse('$_base/products'));
    if (res.statusCode == 200) return json.decode(res.body) as List<dynamic>;
    throw Exception('Error fetching products ${res.statusCode}');
  }

  static Future<List<dynamic>> fetchCombos() async {
    final res = await http.get(Uri.parse('$_base/combos'));
    if (res.statusCode == 200) return json.decode(res.body) as List<dynamic>;
    throw Exception('Error fetching combos ${res.statusCode}');
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(Uri.parse('$_base/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'correo_electronico': email, 'password': password}));
    if (res.statusCode == 200) return json.decode(res.body) as Map<String, dynamic>;
    return {'success': false, 'status': res.statusCode, 'body': res.body};
  }

  static Future<Map<String, dynamic>> createSale(Map<String, dynamic> payload) async {
    final res = await http.post(Uri.parse('$_base/pedidos'),
        headers: {'Content-Type': 'application/json'}, body: json.encode(payload));
    if (res.statusCode == 200 || res.statusCode == 201) return json.decode(res.body) as Map<String, dynamic>;
    return {'success': false, 'status': res.statusCode, 'body': res.body};
  }

  // Endpoint to upload image for product (multipart)
  static Future<bool> uploadProductImage(int productId, String filePath) async {
    final uri = Uri.parse('$_base/products/$productId/image');
    // Placeholder: implement multipart upload using http.MultipartRequest when needed
    return false;
  }
}
