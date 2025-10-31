import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class BranchesScreen extends StatefulWidget {
  const BranchesScreen({super.key});
  @override
  State<BranchesScreen> createState() => _BranchesScreenState();
}

class _BranchesScreenState extends State<BranchesScreen> {
  @override
  Widget build(BuildContext context) {
    final prov = Provider.of<AppProvider>(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Sucursales')),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          ...prov.branches.map((b) => Card(
                child: ListTile(
                  title: Text(b['name'] ?? b['NOMBRE']),
                  subtitle: Text('Ventas: Q${b['todayRevenue'] ?? 0}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.assessment),
                    onPressed: () {
                      // Placeholder: show a simple report dialog
                      showDialog(
                        context: context,
                        builder: (_) => AlertDialog(
                          title: Text('Reporte - ${b['name'] ?? 'sucursal'}'),
                          content: Text('Ventas hoy: Q${b['todayRevenue'] ?? 0}\nPedidos: ${b['ordersToday'] ?? 0}'),
                          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cerrar'))],
                        ),
                      );
                    },
                  ),
                ),
              )),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () {
              // Placeholder to fetch branch reports from backend
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fetch branch reports (implement endpoint)')));
            },
            child: const Text('Actualizar reportes desde servidor'),
          )
        ],
      ),
    );
  }
}
