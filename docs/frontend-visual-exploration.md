# Exploración visual local de UNMSM Admission Analytics

Esta guía describe el recorrido repetible para inspeccionar una pantalla, llegar al componente correcto y capturar el resultado en desktop y mobile.

## Capturas automatizadas

Desde la raíz del repositorio:

```bash
scripts/capture-dashboard.sh
```

El script:

1. Levanta Django en `8001` con CORS habilitado para el frontend local.
2. Levanta Vite en `5174` usando `http://127.0.0.1:8001` como API.
3. Espera `/health/` y la página frontend antes de capturar.
4. Usa Playwright + Chromium.
5. Captura:
   - Desktop: `1440x1000`.
   - Mobile: `390x844`.
6. Mata ambos procesos al terminar, incluso si la captura falla.

Los archivos quedan en `.artifacts/screenshots/` —directorio temporal, no parte del producto— junto con `backend.log` y `frontend.log`.

### Cambiar la ruta o la salida

```bash
ROUTE='/?process=7&compare=6' scripts/capture-dashboard.sh
OUTPUT_DIR=/tmp/unmsm-preview scripts/capture-dashboard.sh
API_PORT=8011 FRONTEND_PORT=5175 scripts/capture-dashboard.sh
```

`ROUTE` debe comenzar con `/`. Los query params son importantes: la aplicación guarda el proceso, las comparaciones y los filtros en la URL.

El script usa la base SQLite local disponible. Si no hay registros representativos, no se deben fabricar datos dentro del repositorio: usar un mock temporal fuera del árbol del proyecto y etiquetar las capturas como mock.

## Cómo llegar al componente correcto

### 1. Identificar la ruta

Las rutas principales están en:

```text
apps/fronted/src/app/router.tsx
```

Actualmente:

- `/` → `DashboardPage`.
- `/resultados` → `ResultsPage`.
- `/analytics/careers/:majorId` → `MajorDetailPage`.

El shell compartido —header, marca y `Outlet`— está en:

```text
apps/fronted/src/app/App.tsx
```

No atribuir un cambio del header de la aplicación a `DashboardPage`; son capas distintas. Parece obvio. La interfaz no siempre coopera.

### 2. Seguir la composición de la página

Para el dashboard:

```text
DashboardPage
└── DashboardControls
    ├── selector de proceso
    └── comparación de procesos
└── DashboardContent
    ├── KpiGrid
    ├── ComparisonSummary
    ├── ProcessComparisonChart
    ├── MajorDemandRanking
    └── MajorBreakdown
        └── DashboardFilterControls
```

Los puntos de entrada están en:

```text
apps/fronted/src/features/analytics/pages/DashboardPage.tsx
apps/fronted/src/features/analytics/components/DashboardContent.tsx
```

Primero leer la página y la composición. Después leer el componente visible que contiene el texto o control afectado. No empezar por CSS: si la jerarquía está duplicada, cambiar márgenes solo la disfraza.

### 3. Buscar el texto visible

Desde la raíz:

```bash
rg -n 'texto visible|aria-label|data-testid' apps/fronted/src
```

Ejemplos:

```bash
rg -n 'Resumen de|Proceso analizado|Comparar con' \
  apps/fronted/src/features/analytics
```

Cuando el texto aparece en varias capas, inspeccionar también los tests:

```bash
rg -n 'Resumen de|Proceso analizado' \
  apps/fronted/src/features/analytics/pages/*.test.tsx
```

El test debe verificar la intención de la interfaz: presencia de la nueva jerarquía y ausencia del texto redundante, no solamente snapshots frágiles.

### 4. Explorar en el navegador

Con el script levantado manualmente o durante una captura:

```bash
cd apps/fronted
VITE_API_BASE_URL=http://127.0.0.1:8001 npm run dev -- --host 0.0.0.0 --port 5174
```

Abrir la ruta deseada, por ejemplo:

```text
http://127.0.0.1:5174/?process=7
```

Usar el snapshot de accesibilidad para confirmar:

- El nombre accesible del control.
- El heading que realmente se renderiza.
- El orden: contexto → KPI → contenido.
- La ausencia de la etiqueta eliminada.

Usar la consola del navegador para revisar recursos API y errores JavaScript. Un dashboard que muestra solo “Cargando…” no es evidencia visual válida; primero hay que resolver API, CORS o datos.

### 5. Elegir la captura

Antes de mandar una captura, verificar ambas dimensiones:

- Desktop: controles alineados, KPI legibles, sin huecos estructurales.
- Mobile: contexto apilado, controles utilizables, tarjetas legibles, sin overflow horizontal.

La captura debe etiquetarse como **local/branch build**, **preview del PR** o **producción**. Una captura local no demuestra que el PR ya esté desplegado. La física básica sigue aplicando, incluso en dashboards.

## Verificación mínima antes de enviar

```bash
cd apps/fronted
npm test
npm run lint
npm run build
cd ../..
git diff --check
```

Después revisar las imágenes y confirmar que contienen el cambio solicitado. Para cambios de UX/UI no basta con que TypeScript compile: la jerarquía tiene que verse bien en ambos viewports.
