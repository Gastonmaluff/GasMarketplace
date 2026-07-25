# Reglas de desarrollo

Estas reglas aplican a todo el repositorio:

1. Leer `README.md` y `docs/ARCHITECTURE.md` antes de desarrollar.
2. No agregar lógica comercial al núcleo de la plantilla.
3. No duplicar módulos reutilizables.
4. Mantener TypeScript estricto.
5. No introducir dependencias sin una necesidad clara.
6. Separar la personalización visual de la lógica funcional.
7. No guardar secretos ni credenciales en el repositorio.
8. Mantener componentes pequeños y reutilizables.
9. Actualizar la documentación cuando cambie la arquitectura.
10. Ejecutar typecheck, lint, pruebas y build antes de terminar.
11. No envolver automáticamente cada sección en una card; usar cards únicamente para agrupar contenido relacionado.
12. Evitar cards anidadas.
13. No utilizar bordes laterales decorativos para la navegación activa.
14. No agregar gradientes, sombras o brillos sin una razón clara.
15. Priorizar jerarquía, espaciado y divisores.
16. Evitar patrones visuales genéricos típicos de interfaces generadas automáticamente.
17. Los montos deben almacenarse como números limpios; no guardar separadores visuales en la base de datos.
18. Los teléfonos deben guardar una versión normalizada separada de su formato visual.
19. No aplicar capitalización automática a correos, contraseñas, RUC, códigos o identificadores.
20. Aplicar normalización de nombres únicamente en campos donde corresponda y de forma explícita.
21. Utilizar `es-PY` como locale predeterminado, permitiendo sobrescribirlo cuando el sistema lo requiera.

Cuando una implementación necesite desviarse de estas reglas, documentar la razón y el alcance antes de hacer el cambio.
