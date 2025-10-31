import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../services/api.dart';
import 'branches_screen.dart';
import 'offline_sales.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    final prov = Provider.of<AppProvider>(context, listen: false);
    prov.setLoading(true);
    try {
      final products = await ApiService.fetchProducts();
      final combos = await ApiService.fetchCombos();
      prov.setProducts(products);
      prov.setCombos(combos);
      // branches: placeholder; backend should provide /branches endpoint
      prov.setBranches([]);
    } catch (e) {
      debugPrint('Error loading data: $e');
    } finally {
      prov.setLoading(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final prov = Provider.of<AppProvider>(context);
    return Scaffold(
      appBar: AppBar(title: const Text('La Cazuela Chapina')),
      body: prov.loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: loadData,
              child: ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  const Text('Combos', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...prov.combos.map((c) => ListTile(
                        title: Text(c['NOMBRE_PRODUCTO'] ?? c['name'] ?? 'Sin nombre'),
                        subtitle: Text('Q${(c['PRECIO_BASE'] ?? c['price'] ?? 0).toString()}'),
                      )),
                  const SizedBox(height: 12),
                  const Text('Productos', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...prov.products.map((p) => ListTile(
                        title: Text(p['NOMBRE_PRODUCTO'] ?? p['name'] ?? 'Sin nombre'),
                        subtitle: Text(p['Tipo_producto'] ?? p['Tipo'] ?? ''),
                      )),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const BranchesScreen())),
                    icon: const Icon(Icons.store),
                    label: const Text('Sucursales & Reportes'),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const OfflineSalesScreen())),
                    icon: const Icon(Icons.cloud_off),
                    label: const Text('Ventas offline / Sincronización'),
                  ),
                ],
              ),
            ),
    );
  }
}
