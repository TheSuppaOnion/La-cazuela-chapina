Mobile app (Flutter) for La Cazuela Chapina

This folder contains a scaffolded Flutter app that mirrors the web frontend functionality:
- Products and combos listing (calls backend /products and /combos)
- Branches management screen with simple per-branch report dialog
- Offline sales queue using sqflite and a manual synchronization button
- Push notifications: integration hooks for Firebase Messaging + local notifications

Quick start
1. Install Flutter SDK: https://flutter.dev/docs/get-started/install
2. From this folder run:

```powershell
cd Mobile
flutter pub get
```

3. Copy `.env.example` to `.env` and set `API_BASE_URL` (for Android emulator use `http://10.0.2.2:5000/api`).
4. Setup Firebase for Android/iOS if you want push notifications (place the Google-services files in the respective platform folders). See Firebase docs.
5. Run on Android emulator:

```powershell
flutter run
```

Notes and next steps
- The app assumes the backend endpoints exist: `/products`, `/combos`, `/auth/login`, and a `POST /pedidos` for creating orders. If `branches` endpoints are needed add them in backend and the API service.
- The offline DB stores sales as raw string payloads in `offline_sales` table. You can serialize/deserialize JSON before sending.
- Push notifications: configure Firebase and ensure proper native setup (AndroidManifest, AppDelegate, gradle).
- For uploading product images from the app, implement multipart upload using `http.MultipartRequest` and the backend `/api/products/{id}/image` endpoint.

If you want, I can:
- Implement the native Firebase setup steps and add example code to register device tokens with the backend.
- Add UI for creating a sale and queueing it offline (currently only the queue and sync screen exist).
- Add example unit tests for key services.
