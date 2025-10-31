import 'package:flutter/material.dart';

class AppProvider extends ChangeNotifier {
  bool loading = false;
  List products = [];
  List combos = [];
  List branches = [];

  // Offline sales queue
  List<Map<String, dynamic>> offlineSales = [];

  void setLoading(bool v) {
    loading = v;
    notifyListeners();
  }

  void setProducts(List p) {
    products = p;
    notifyListeners();
  }

  void setCombos(List c) {
    combos = c;
    notifyListeners();
  }

  void setBranches(List b) {
    branches = b;
    notifyListeners();
  }

  void queueOfflineSale(Map<String, dynamic> sale) {
    offlineSales.add(sale);
    notifyListeners();
  }

  void clearOfflineSales() {
    offlineSales.clear();
    notifyListeners();
  }
}
