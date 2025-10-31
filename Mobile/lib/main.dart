import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'providers/app_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Load environment variables if present. If the .env file is missing we
  // continue with defaults instead of crashing the app (FileNotFoundError).
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    // Log to console for debugging, but do not rethrow so the app can start.
    // Common case: developer didn't create a .env locally (expected in some setups).
    print('Warning: .env file not found or failed to load: $e');
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppProvider(),
      child: MaterialApp(
        title: 'La Cazuela Chapina',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
        ),
        initialRoute: '/',
        routes: {
          '/': (_) => const HomeScreen(),
          '/login': (_) => const LoginScreen(),
        },
      ),
    );
  }
}
