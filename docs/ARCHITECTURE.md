# Arquitectura

## Objetivo

Gaston Web Starter separa infraestructura, presentación y futuras capacidades de negocio. El núcleo solamente resuelve preocupaciones transversales y conserva una superficie pequeña para que cada sistema pueda evolucionar sin heredar módulos innecesarios.

## Capas

| Carpeta                    | Responsabilidad                                             |
| -------------------------- | ----------------------------------------------------------- |
| `src/app`                  | Composición raíz, límites globales y rutas.                 |
| `src/components/shell`     | Carcasa interna reutilizable: sidebar y topbar.             |
| `src/components/ui`        | Componentes visuales pequeños y reutilizables.              |
| `src/components/ui/inputs` | Inputs regionales con valor visual y normalizado separados. |
| `src/config`               | Configuración central tipada de la aplicación.              |
| `src/demo`                 | Páginas, datos y configuración exclusivamente ficticios.    |
| `src/layouts`              | Estructura compartida de áreas públicas e internas.         |
| `src/lib`                  | Adaptadores de servicios externos, como Firebase.           |
| `src/modules`              | Capacidades funcionales futuras, aisladas por módulo.       |
| `src/pages`                | Pantallas asociadas a rutas.                                |
| `src/styles`               | Variables de tema y estilos globales.                       |
| `src/types`                | Tipos compartidos sin comportamiento.                       |
| `src/utils`                | Funciones puras o utilidades transversales.                 |
| `src/utils/formatters`     | Formato y limpieza regional de números y teléfonos.         |
| `src/utils/normalizers`    | Normalización explícita de campos de texto.                 |

## Flujo de la aplicación

`main.tsx` aplica el tema y monta `App`. La raíz instala el límite global de errores y React Router. Los layouts contienen navegación y delegan el contenido de cada ruta mediante `Outlet`. Las páginas combinan componentes, pero no inicializan infraestructura directamente.

El layout demostrativo de `src/demo/layouts` compone `Sidebar`, `Topbar` y el contenido de la ruta. La preferencia expandida o colapsada se persiste con una clave versionada de `localStorage`. En móviles, la navegación cambia a un drawer temporal que cierra al navegar, tocar fuera o presionar Escape, y bloquea el scroll de fondo mientras está abierto.

## Configuración

`app.config.ts` es la fuente de verdad para identidad, región, banderas de funcionalidades y tokens visuales editables. Define logos, colores, radio, densidad y anchos del sidebar. `apply-app-theme.ts` traduce esa configuración a variables CSS; los componentes consumen los tokens sin importar la configuración directamente. El objeto está validado con `satisfies AppConfig`, por lo que conserva tipos literales y a la vez impide propiedades inválidas.

## Componentes reutilizables

`src/components/ui` contiene primitivas sin reglas de negocio, como `PageHeader`, botones, campos, badges, tarjetas, alertas, tabla, modal, toast y carga local de imágenes. Las páginas pueden componerlas, pero no deben introducir dependencias de dominio dentro de ellas. `/demo/componentes` documenta visualmente sus estados principales.

Los inputs especializados viven en `src/components/ui/inputs`. `NumericInput` conserva un `number | null` independiente del texto presentado; `ParaguayPhoneInput` entrega el formato visible y una versión canónica `+595` por separado. Ambos consumen la configuración regional existente y permiten sobrescribir las opciones necesarias sin incorporar reglas de un cliente.

Las transformaciones puras permanecen fuera de React: `src/utils/formatters` resuelve números y teléfonos, mientras `src/utils/normalizers` transforma texto únicamente cuando el componente lo solicita. `TextField` ejecuta la normalización explícita al perder el foco. Separadores de miles, símbolos monetarios y máscaras telefónicas son presentación y nunca forman parte del dato persistido.

`src/components/shell` agrupa elementos estructurales del área interna. `Sidebar` recibe su navegación y etiquetas; `Topbar` recibe contexto, estado, acciones y un perfil opcional. Los valores ficticios se inyectan desde `src/demo/demo.config.ts`.

## Aislamiento de la demostración

`src/demo` puede eliminarse junto con sus rutas sin afectar las primitivas del núcleo. Contiene páginas, layout, configuración, perfil y datos ficticios. La demostración puede importar componentes genéricos; los componentes genéricos nunca deben importar desde `src/demo`.

## Firebase opcional

`lib/firebase/config.ts` lee las variables expuestas por Vite y calcula si la configuración está completa. `client.ts` inicializa de forma perezosa una única instancia y entrega Authentication, Firestore, Functions y Storage. Si falta configuración, devuelve `null`; importar el módulo nunca impide que la aplicación arranque.

## Módulos futuros

Cada módulo nuevo debe vivir en `src/modules/<modulo>` y encapsular su dominio. Puede exponer rutas o componentes hacia `app`, pero no debe modificar componentes genéricos para introducir reglas comerciales. La comunicación entre módulos debe realizarse mediante APIs públicas explícitas.

## Decisiones de calidad

- TypeScript se ejecuta con `strict` y `noUncheckedIndexedAccess`.
- ESLint controla errores de código y Prettier el formato.
- Vitest y Testing Library validan el comportamiento observable.
- GitHub Actions reproduce typecheck, lint, pruebas y build en cada push y pull request.
