import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class OfflineDb {
  static Database? _db;

  static Future<Database> getDb() async {
    if (_db != null) return _db!;
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, 'la_cazuela.db');
    _db = await openDatabase(path, version: 1, onCreate: (db, v) async {
      await db.execute('''
        CREATE TABLE offline_sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payload TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      ''');
    });
    return _db!;
  }

  static Future<int> addOfflineSale(Map<String, dynamic> payload) async {
    final db = await getDb();
    return db.insert('offline_sales', {'payload': payload.toString(), 'created_at': DateTime.now().millisecondsSinceEpoch});
  }

  static Future<List<Map<String, dynamic>>> getOfflineSales() async {
    final db = await getDb();
    final rows = await db.query('offline_sales', orderBy: 'created_at ASC');
    return rows.map((r) {
      return {
        'id': r['id'],
        'payload': r['payload'],
        'created_at': r['created_at'],
      };
    }).toList();
  }

  static Future<void> clearOfflineSales() async {
    final db = await getDb();
    await db.delete('offline_sales');
  }
}
