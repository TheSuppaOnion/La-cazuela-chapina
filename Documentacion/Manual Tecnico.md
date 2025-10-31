
# Manual Técnico — La Cazuela Chapina

Este documento describe la arquitectura, configuración, compilación y ejecución del proyecto "La Cazuela Chapina" para desarrolladores.

Requisitos
--------------
- .NET SDK 8.0 (o runtime 8.0 en producción)
- Node.js 18+ y npm (para generar el build del frontend)
- Oracle DB (o equivalente) si se quiere ejecutar la base de datos localmente
- Clave para OpenRouter para la parte de llm

Variables de entorno importantes (.env)
----------------------------------
- `OPENROUTER_API_KEY` — clave para el proxy LLM en el backend (opcional).
- `VITE_API_URL` (opcional) — URL del backend para el frontend (si se configura vía `.env` en `Frontend/`).
- Variables de conexión a la BD usadas por `Program.cs` (revisar `Backend/Program.cs` para nombres concretos; puede estar embebida en la cadena de conexión).

Backend (.NET)
-------------------

Ubicación: `Backend/`.

Endpoints claves (ejemplos):

- `GET /api/products` — lista de productos
- `GET /api/products/{id}` — detalle producto
- `POST /api/products` — crear producto (admin)
- `GET /api/combos` — combos
- `POST /api/llm` — proxy al proveedor LLM (OpenRouter)
- `GET /api/admin/analytics` — KPIs y métricas

Notas de desarrollo:
- `Program.cs` es el punto principal; al editar endpoints revisar dependencias y Dapper/Oracle cliente que el proyecto usa.
- Si añades paquetes, usa `dotnet add package <package>` y actualiza la solución.

Base de datos (Oracle)
-------------------------
Modelo Lógico ![Modelo Lógico](assets/modeloLogico.png)
Modelo Entidad-Relación ![Modelo E-R](assets/modeloER.png)

Si se quiere saber más información acerca de los atributos y relaciones, también se ofrece el diccionario de datos en `Documentacion/assets/DiccionarioDatos/`.

Los scripts SQL están en `BD/`:

- `BD.sql` — DDL principal para crear tablas.
- `constraints.sql` — constraints y secuencias.

Pasos básicos:

1. Abrir cliente Oracle (SQL Developer, SQL*Plus o DBeaver).
2. Ejecutar `BD/BD.sql` en el esquema objetivo.
3. Ejecutar `BD/constraints.sql` para crear constraints y triggers.
4. Importar CSVs de `Archivos de prueba/` si los necesitas (productos, inventario, unidad, pedidos).

Nota: los CSV asumen columnas concretas; revisa los encabezados antes de importar.

Frontend (React + Vite)
---------------------------
[Manual Usuario](Manual%20Usuario.md)

Ubicación: `Frontend/`.

Instalación y ejecución:

```powershell
cd ./Frontend
npm install
npm run dev
```

Configuración de la URL del backend:
- Puedes crear `Frontend/.env` con:

```
VITE_API_URL=http://localhost:5000
```

Y luego adaptar `AppContext.jsx` para leer `import.meta.env.VITE_API_URL` como `API_URL_DIRECT` (si no ya lo hace).

Comportamiento del chat y LLM en frontend:
- El chat en `Home.jsx` envía un `messages` array al endpoint `/api/llm` con un `system` prompt que pide JSON.
- La UI parsea la respuesta y la muestra al usuario; si la respuesta no es JSON válido, se añade como texto crudo.

Integración LLM (OpenRouter)
--------------------------------

El backend expone `/api/llm` que actúa como proxy a OpenRouter. Para usarlo:

1. Configura `$env:OPENROUTER_API_KEY` en tu entorno donde corre el backend.
2. El frontend envía `POST /api/llm` con `{ messages: [ ... ] }` y el backend reenvía al proveedor.


Despliegue y consideraciones
--------------------------------

Requisitos para producción
- .NET runtime 8.0 o superior (para ejecutar la aplicación publicada)
- Node.js (para generar el bundle del frontend)
- Base de datos Oracle accesible desde la infraestructura de producción
- Certificados TLS/SSL para HTTPS
- Un gestor de secretos o variables de entorno seguras

Despliegue sin contenedores (pasos resumidos)

1) Compilar backend:

```powershell
cd ./Backend
dotnet build
```
Crea tu .env:
```powershell
# Configuracion de ejemplo de variables de entorno para el backend de La Cazuela Chapina

# Oracle DB connection
ORACLE_DB_HOST=localhost
ORACLE_DB_PORT=1521
ORACLE_DB_SID=XE
ORACLE_DB_USER=oracle
ORACLE_DB_PASS=password

# Frontend url
FRONTEND_URL=http://localhost:5173

# OpenRouter API key
# Obtén una en https://openrouter.ai y pégala aquí
OPENROUTER_API_KEY=your_openrouter_api_key_here

# (Optional) Fallback to use OPENAI API key if you prefer
# OPENAI_API_KEY=your_openai_api_key_here
```

Salida esperada: la app escucha en `http://localhost:5000` y `https://localhost:5001` (revisar consola).


2) Compilar frontend:

```powershell
cd Frontend
npm install --production
npm run build
# El resultado se coloca típicamente en Frontend/dist (revisa vite.config.js)
```

Diagnóstico de rendimiento con React Scan (opcional)
---------------------------------------------------

Para analizar problemas de rendimiento en la app React puedes usar React Scan (herramienta externa que inspecciona la app en ejecución). A continuación se muestran pasos comprobados en este repositorio para instalar y ejecutar React Scan junto con Playwright/Chromium (driver que usa para la inspección):

1. Asegúrate de que el servidor de desarrollo de la aplicación esté corriendo (Vite por defecto en el puerto 5173):

```powershell
cd "\Frontend"
npm run dev
# deja el servidor corriendo en una terminal
```

2. Instala `react-scan` en el proyecto (opcional, facilita la ejecución):

```powershell
npm i react-scan
```

3. Instala Playwright y descarga Chromium (necesario para que React Scan ejecute las pruebas/inspección):

```powershell
npm install -D playwright
npx playwright install chromium
# Si tu entorno no tiene `npx`, usa la alternativa:
# npm exec --package=playwright playwright install chromium
```

4. Ejecuta React Scan apuntando a la URL donde corre tu app (ej.: http://localhost:5173):

```powershell
# si instalaste react-scan localmente
npx react-scan http://localhost:5173
# alternativa con npm exec
npm exec -- react-scan http://localhost:5173
```

Notas:
- React Scan se ejecuta externamente y conecta con la app en la URL indicada; no modifica el código del frontend.
- Si `npx` no está disponible en tu entorno, `npm exec` es una alternativa compatible.
- Añadir Playwright como dev-dependency y ejecutar `playwright install chromium` asegura que el driver requerido esté presente.

Estos pasos se verificaron en este proyecto y permiten lanzar React Scan para inspección de rendimiento.

Flutter / Mobile (ejecución local)
---------------------------------

La carpeta `Mobile/` contiene un scaffold Flutter con `pubspec.yaml` y `lib/main.dart`. A continuación tienes pasos y los comandos exactos que se usaron y funcionaron en este entorno Windows (incluyendo cómo configurar el Android SDK cuando está en una ruta personalizada como `C:\AndroidSDK`).

1. Preparación / SDK

	- Si el Android SDK está en una ruta personalizada (ej. `C:\AndroidSDK`) establece la variable para la sesión y añade `platform-tools` y `emulator` al PATH (temporalmente en PowerShell):

	```powershell
	$env:ANDROID_SDK_ROOT = 'C:\AndroidSDK'
	$env:ANDROID_HOME = $env:ANDROID_SDK_ROOT
	$env:PATH = $env:PATH + ';' + "$env:ANDROID_SDK_ROOT\platform-tools" + ';' + "$env:ANDROID_SDK_ROOT\emulator" + ';' + "$env:ANDROID_SDK_ROOT\cmdline-tools\latest\bin"
	```

	- Registra el SDK para Flutter (persistente para Flutter config):

	```powershell
	flutter config --android-sdk "C:\AndroidSDK"
	```

2. Aceptar licencias Android (si aplicable)

```powershell
flutter doctor --android-licenses
# responde 'y' a todas
```

3. Si el proyecto no tiene plataformas generadas (mensaje: “found, but not supported by this project”), genera los archivos de plataforma sin tocar `lib/`:

```powershell
cd "\Mobile"
flutter create .
```

4. Obtener dependencias y ejecutar en el emulador o dispositivo

```powershell
flutter pub get
flutter devices          # lista dispositivos y emuladores disponibles
flutter run -d emulator-5554   # o flutter run (si sólo hay un emulador/con dispositivo conectado)
```

5. Comandos útiles de diagnóstico

```powershell
# ver ruta de adb/emulator
where.exe adb
adb --version
& "C:\AndroidSDK\emulator\emulator.exe" -list-avds
# reiniciar adb
adb kill-server
adb start-server
adb devices
flutter doctor -v
flutter devices
```

Comandos que se verificaron en esta sesión del proyecto (ejemplos que funcionaron):

```powershell
# establecer SDK (sesión)
$env:ANDROID_SDK_ROOT = 'C:\AndroidSDK'
flutter config --android-sdk "C:\AndroidSDK"
flutter create .
flutter pub get
flutter run
```
