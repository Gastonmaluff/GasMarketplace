# Gaston Web Starter

Plantilla base profesional para iniciar sistemas web personalizados con una arquitectura limpia, estricta y fácil de mantener. Es un punto de partida técnico: no pertenece a ningún cliente ni incorpora reglas de un negocio concreto.

## Qué incluye

- React, TypeScript estricto y Vite.
- React Router con layout público, layout interno demostrativo y página 404.
- Configuración central de identidad, región y funcionalidades.
- Carcasa interna responsive con sidebar persistente, drawer móvil y topbar reutilizable.
- Catálogo visual de componentes en `/demo/componentes`.
- Componentes reutilizables de carga, estado vacío y manejo global de errores.
- Inputs regionales para números y teléfonos paraguayos, además de normalización explícita de texto.
- Firebase JavaScript SDK modular preparado para Authentication, Firestore, Functions y Storage.
- CSS moderno, responsive, accesibilidad básica y variables de tema.
- ESLint, Prettier, Vitest, Testing Library y cobertura.
- Integración continua con GitHub Actions.

## Qué no incluye

No contiene clientes, ventas, reservas, inventario, obras, peluquerías, parques infantiles, quintas, facturación electrónica, GasPrint ni otros módulos comerciales. Tampoco incluye credenciales, un proyecto Firebase real ni un despliegue.

## Requisitos

- Node.js 22.12 o superior (Node.js 24 recomendado).
- npm 11 o superior.
- Git 2.40 o superior.

## Instalación y uso

```bash
npm install
npm run dev
```

Vite mostrará la URL local. Otros comandos disponibles:

```bash
npm run typecheck       # valida TypeScript
npm run lint            # analiza el código
npm run format          # aplica Prettier
npm run test            # ejecuta las pruebas
npm run test:coverage   # genera cobertura
npm run build           # crea el build de producción
npm run preview         # sirve el build localmente
```

## Variables de entorno y Firebase

Copiá `.env.example` como `.env.local` y completá únicamente valores públicos de configuración del SDK web. No confirmes `.env.local` ni claves privadas.

Mientras falte cualquiera de las variables requeridas, `getFirebaseServices()` devuelve `null` y la interfaz indica claramente que Firebase está pendiente. No hace falta Firebase para ejecutar, probar o compilar la plantilla.

## Personalización

Editá `src/config/app.config.ts` para cambiar:

- nombre y descripción;
- logos completo y compacto;
- colores principal, secundario y del sidebar;
- radio de bordes y densidad visual;
- anchos expandido y colapsado del sidebar;
- idioma, zona horaria y moneda;
- funcionalidades habilitadas.

Los colores se aplican como variables CSS al iniciar la aplicación. Los tokens adicionales de apariencia viven en `src/styles/variables.css`; la lógica funcional no debe depender de ellos.

## Demostración interna y UI Kit

La ruta `/demo` presenta la carcasa interna reutilizable. En escritorio, el sidebar puede expandirse o colapsarse y guarda la preferencia en `localStorage`; en pantallas pequeñas se convierte en un drawer temporal. La topbar y `PageHeader` aceptan contexto, estado y áreas de acciones sin incorporar autenticación ni reglas de negocio.

La ruta `/demo/componentes` funciona como catálogo visual de botones, formularios, badges, estados, alertas, modal, toast, tabla responsive, filtros, carga local de imágenes y campos con formato regional. Los componentes genéricos viven en `src/components/ui`; la página, los datos ficticios, el usuario y las etiquetas demostrativas viven en `src/demo`.

### Formatos regionales y valores almacenados

`NumericInput` muestra separadores y símbolos según el locale, pero entrega `number | null` mediante `onValueChange`. Por ejemplo, `1.500.000` se conserva internamente como `1500000`. Nunca guardes puntos de miles, prefijos, sufijos ni símbolos monetarios en la base de datos. El locale predeterminado proviene de `app.config.ts` (`es-PY`) y puede sobrescribirse por campo; PYG utiliza cero decimales salvo configuración explícita.

`ParaguayPhoneInput` acepta espacios, guiones, paréntesis, formato nacional y `+595`. Su callback separa el valor visual del normalizado, por ejemplo `0981 123 456` y `+595981123456`. La plantilla no realiza conexiones con WhatsApp ni servicios externos.

`TextField` admite la propiedad opcional `normalization` con los modos `none`, `trim`, `person-name`, `title-case`, `uppercase` y `lowercase`. La transformación ocurre al perder el foco para no interferir con la escritura. Activá `person-name` solamente para nombres; no lo uses en correos, contraseñas, RUC, códigos o identificadores.

### Núcleo reutilizable

- `src/app`, `src/components`, `src/config`, `src/layouts`, `src/lib`, `src/styles`, `src/types` y `src/utils` forman la base reutilizable.
- `src/components/ui` contiene primitivas sin dominio: botones, campos, estados, tabla, modal, toast y carga local de imágenes.
- `src/components/ui/inputs` contiene inputs especializados que mantienen separados el valor visual y el valor normalizado.
- `src/components/shell` contiene sidebar y topbar configurables; no incluye usuarios, rutas ni textos demostrativos propios.
- `src/utils/formatters` y `src/utils/normalizers` contienen funciones puras, configurables y sin dependencias de React.

### Contenido demostrativo

Todo lo ficticio está aislado en `src/demo`: layout de ejemplo, páginas, navegación, perfil sin autenticación y dataset del catálogo. Ningún archivo de esa carpeta debe convertirse en fuente de reglas comerciales.

Al iniciar un sistema nuevo, personalizá `app.config.ts`, reemplazá la navegación y el perfil demostrativo, y agregá las capacidades reales dentro de `src/modules`. Para retirar completamente la demo:

1. Eliminá las rutas `/demo` y `/demo/componentes` de `src/app/App.tsx`.
2. Eliminá la carpeta `src/demo`.
3. Retirá los enlaces públicos que apuntan a `/demo`.

Los componentes genéricos permanecen disponibles aunque se elimine toda la demostración.

## Iniciar un sistema nuevo

1. Creá un repositorio nuevo a partir de esta plantilla, sin conservar el historial si el proyecto lo requiere.
2. Cambiá el nombre del paquete en `package.json` y la configuración central.
3. Reemplazá el logo y los metadatos de `index.html`.
4. Configurá las variables locales y los secretos del entorno de despliegue.
5. Conservá el núcleo genérico y agregá funcionalidades mediante módulos.
6. Ejecutá `npm run typecheck`, `npm run lint`, `npm run test` y `npm run build` antes del primer commit.

## Agregar módulos

Creá cada capacidad de negocio dentro de `src/modules/<nombre-del-modulo>`. Un módulo debe agrupar sus rutas, componentes, servicios, tipos y pruebas, y exponer una API pública pequeña. Antes de crear uno nuevo, verificá que no exista una solución reutilizable equivalente. Evitá importar detalles internos de un módulo desde otro.

La estructura y las decisiones principales se explican en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). La arquitectura funcional del comercio electrónico GasMarket (módulos, Firestore, flujo de pedidos, seguridad y roadmap del MVP) está documentada en [docs/ECOMMERCE-ARCHITECTURE.md](docs/ECOMMERCE-ARCHITECTURE.md). Las reglas para agentes y colaboradores automatizados están en [AGENTS.md](AGENTS.md).
