import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../services/api.dart';

class OfflineSalesScreen extends StatefulWidget {
  const OfflineSalesScreen({super.key});
  @override
  State<OfflineSalesScreen> createState() => _OfflineSalesScreenState();
}

class _OfflineSalesScreenState extends State<OfflineSalesScreen> {
  bool syncing = false;

  Future<void> syncSales() async {
    final prov = Provider.of<AppProvider>(context, listen: false);
    if (prov.offlineSales.isEmpty) return;
    setState(() => syncing = true);
    try {
      for (final sale in prov.offlineSales) {
        // map sale shape to API payload
        final res = await ApiService.createSale(sale);
        debugPrint('Sale sync response: $res');
      }
      prov.clearOfflineSales();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sincronización completada')));
    } catch (e) {
      debugPrint('Sync error: $e');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error sincronizando')));
    } finally {
      setState(() => syncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final prov = Provider.of<AppProvider>(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Ventas offline')),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            ElevatedButton.icon(
              onPressed: prov.offlineSales.isEmpty || syncing ? null : syncSales,
              icon: const Icon(Icons.sync),
              label: Text(syncing ? 'Sincronizando...' : 'Sincronizar ventas'),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView(
                children: prov.offlineSales.isEmpty
                    ? [const Center(child: Text('No hay ventas offline'))]
                    : prov.offlineSales
                        .map((s) => ListTile(
                              title: Text('Venta Q${s['total'] ?? 0}'),
                              subtitle: Text('Items: ${(s['items'] ?? []).length}'),
                            ))
                        .toList(),
              ),
            )
          ],
        ),
      ),
    );
  }
}
