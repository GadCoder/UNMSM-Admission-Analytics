# Frontend Design System — Admission Explorer

> Fuente de verdad visual para `apps/fronted`. La interfaz toma la referencia Stitch como dirección de diseño, no como plantilla de componentes o layout.

## Dirección

**Premium academic analytics:** una experiencia calmada, legible y orientada a comparar procesos de admisión. La UI debe priorizar scanabilidad y contexto antes que decoración.

## Tokens

### Color

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-background` | `#faf8f7` | Fondo general cálido |
| `--color-surface` | `#ffffff` | Cards, header y superficies elevadas |
| `--color-text` | `#2d2223` | Texto principal y cifras |
| `--color-muted` | `#6e5e5f` | Metadatos, descripciones y labels |
| `--color-border` | `#e8dfe0` | Divisores y bordes suaves |
| `--color-primary` | `#8f5658` | Acción principal, estado activo y acento |
| `--color-primary-dark` | `#6f4043` | Hover y contraste de marca |
| `--color-primary-soft` | `#f4eded` | Fondos de apoyo y comparación |
| `--color-primary-pale` | `#eadcdd` | Estados sutiles y ordinales |
| `--color-success` | `#2e8b57` | Variación positiva y admisión |
| `--color-warning` | `#c58a2b` | Alertas moderadas y espera |
| `--color-danger` | `#c54b4b` | Error, rechazo o variación negativa |

No introducir colores arbitrarios para decorar. Los gráficos deben usar principalmente el primario y sus tonos suaves, reservando colores semánticos para significado real.

### Tipografía

- Familia: `Lexend`, con fallback sans-serif del sistema.
- Títulos: pesos 700–800, tracking negativo y escala contenida.
- Cuerpo: 14–16px cuando sea texto de lectura.
- Datos y labels: 10–13px, siempre con contraste suficiente.
- Labels de contexto: uppercase, peso 700–800 y tracking entre `.08em` y `.14em`.

### Espaciado y forma

- Escala base de 4px/8px (`--space-*`).
- Cards: radio de 16px (`--radius-lg`) o 20px para contenedores principales.
- Controles: radio de 12px (`--radius-md`).
- Elevación: sombra difusa y discreta, nunca sombras duras.
- Bordes de 1px en lugar de contornos pesados.

## Shell y navegación

La navegación superior es la opción actual por UX:

- Solo exponer destinos que existen y tienen comportamiento real.
- Mantener `Resumen` y `Resultados` visibles.
- No añadir un sidebar con módulos futuros o enlaces inertes.
- Evaluar un sidebar únicamente cuando haya suficientes áreas funcionales para justificarlo.
- El header debe ser compacto, estable y no competir con los datos.

## Dashboard

Orden recomendado:

1. Contexto de página y proceso activo.
2. Filtros principales en una sola fila flexible.
3. KPIs de lectura rápida.
4. Comparaciones visuales.
5. Rankings o breakdowns.
6. Tabla detallada para exploración.

Los filtros deben parecer controles de producto —label breve + valor— y no formularios administrativos grandes. Las selecciones múltiples deben conservar accesibilidad y no depender únicamente de color.

## Componentes

### KPI

Estructura: label muted, valor grande y, cuando exista dato comparable real, variación semántica. No inventar tendencias para llenar espacio.

### Charts

- Un propósito por chart.
- Gridlines mínimas.
- Valores exactos accesibles mediante texto o resumen.
- No depender solo de barras coloreadas para transmitir información.
- Mantener leyendas y ejes ligeros, pero suficientes para interpretar.

### Tables

- Header uppercase muted.
- Filas cómodas y divisores finos.
- Hover sutil.
- Scroll horizontal en mobile.
- Usar encabezados semánticos y caption accesible.

## UX guardrails

- No crear navegación fantasma.
- No duplicar el mismo dato sin una función clara.
- No usar cards como sustituto de jerarquía.
- No agregar métricas ficticias, testimonios ni contenido ornamental.
- Estados loading, error y vacío deben conservar la misma jerarquía visual.
- Mantener targets táctiles adecuados y focus visible.
- Verificar responsive en desktop, tablet y mobile antes de cerrar una iteración.

## Implementación

Los tokens viven en `apps/fronted/src/shared/styles/tokens.css`. Los estilos globales están en `apps/fronted/src/shared/styles/globals.css`; los estilos de shell en `apps/fronted/src/app/App.module.css`; y los estilos específicos del dashboard en `apps/fronted/src/features/analytics/pages/DashboardPage.module.css`.
