# Auditoría de dependencias

Registro de vulnerabilidades conocidas y decisiones tomadas. Última revisión: 2026-07-25.

## Corregidas

| Paquete           | Severidad | Tipo                     | Corrección                                                  |
| ----------------- | --------- | ------------------------ | ----------------------------------------------------------- |
| `brace-expansion` | Alta      | Transitiva (tooling dev) | `npm audit fix` sin breaking changes (GHSA-mh99-v99m-4gvg). |

## Aceptadas temporalmente

### react-router / react-router-dom (GHSA-qwww-vcr4-c8h2, severidad alta)

- **Afectados**: `react-router` 7.12.0 – 8.2.0, arrastrado por `react-router-dom` (dependencia
  directa de producción, actualmente 7.18.1, la última publicada de la línea 7).
- **Vulnerabilidad**: bypass de CSRF en **modo RSC (React Server Components)** que permite ejecutar
  actions antes de responder 400.
- **Exposición real**: nula en este proyecto. GasMarketplace es una SPA cliente con
  `BrowserRouter`; no usa modo RSC, server actions ni framework mode, por lo que el código
  vulnerable no se ejercita.
- **Por qué no se corrigió**: no existe fix compatible. `npm audit fix --force` propone un
  **downgrade** breaking a `react-router-dom@7.11.0`; el fix real vive en `react-router@8.3.0`,
  que requiere migración mayor a la línea v8 (cambio de paquete e imports). Ambas opciones violan
  la política de no aplicar cambios mayores riesgosos de forma automática.
- **Plan**: migrar a `react-router` v8 como tarea propia, con pruebas, cuando la línea esté madura
  o antes de exponer la aplicación a tráfico real. Reevaluar en cada auditoría si aparece un parche
  en la línea 7.

## Workspace `functions/` (Cloud Functions)

El workspace usa `firebase-admin@14.2.0` y `firebase-functions@7.3.0` (última estable; el tag
`latest` del registry apunta a una release candidate que se evitó deliberadamente). `npm audit`
reporta 12 vulnerabilidades (5 altas, 7 moderadas), todas **transitivas dentro del propio SDK de
Google** (`brace-expansion` vía `google-gax`, `uuid` vía `gaxios`/`teeny-request`):

- No existe versión más nueva de `firebase-admin` que las resuelva; el único "fix" que ofrece npm
  es un downgrade breaking a `firebase-admin@10`, descartado.
- Es código que corre únicamente en el servidor (Cloud Functions), no en el navegador, y los
  vectores (expansión de llaves y bounds de `uuid` v3/v5/v6) no se ejercitan con entrada de
  usuario en este proyecto.
- Reevaluar en cada auditoría cuando Google publique versiones que actualicen su cadena interna.

## Mayores disponibles no aplicados (sin necesidad clara)

`@testing-library/jest-dom` 7, `@types/node` 26 y `typescript` 7 tienen versiones mayores
publicadas. No se actualizan hasta que exista una necesidad concreta, siguiendo la regla de
actualizaciones mínimas y compatibles.
