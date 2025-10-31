// Notifications were removed because the flutter_local_notifications / firebase_messaging
// plugins caused an Android Gradle plugin build error (missing namespace) during local
// development. Keep a minimal no-op Notifications class so callers don't need changes.

class Notifications {
  /// No-op init. Previously initialized Firebase Messaging and local notifications.
  static Future<void> init() async => Future.value();

  /// No-op notifier replacement used by the app when notifications are disabled.
  static Future<void> notifySaleCreated(String branchName, double total) async => Future.value();
}
