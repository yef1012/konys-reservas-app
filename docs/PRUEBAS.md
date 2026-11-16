# Pruebas de KONYS PIZZA

Fecha: **15 de noviembre de 2026**, para revisión antes de la entrega del lunes 16.

## Alcance y entorno

Verificación local en Windows/PowerShell con Node **v24.19.0**, npm **11.17.0** y las dependencias existentes (Expo 58). No se instalaron ni actualizaron paquetes. Base revisada: commit `6766f9f`, cuarto commit local. Los cambios descritos aquí todavía no tienen commit ni push.

El funcionamiento previo en iPhone mediante Expo Go y la conexión con Supabase fueron informados por el equipo. **Esta intervención no volvió a probar la aplicación en un teléfono ni en un navegador.** No se realizaron consultas o escrituras al proyecto Supabase, cambios SQL, pruebas de RLS remotas ni capturas de pantalla.

## Problemas corregidos

| Problema comprobado en el código | Corrección y evidencia |
| --- | --- |
| Crear una reserva solo guardaba la confirmación; el listado y contador administrativos conservaban datos anteriores. | `src/services/create-reservation.ts`, `createReservationAction`, recarga los datos después de confirmar. Un fallo posterior de recarga conserva el éxito de la reserva y comunica el error; no reintenta la creación. |
| `refresh` podía invalidar la sincronización de Auth sin terminar `authLoading`. | `src/state/restaurant-sync.ts`, `refresh`, coordina las solicitudes y finaliza ambos indicadores únicamente para la solicitud vigente. Descarta respuestas anteriores. |
| Renovar un token borraba permisos y datos y desmontaba las pantallas administrativas. | `setSession` conserva el estado del mismo usuario mientras revalida. Cambio de usuario o cierre de sesión borra los datos privados inmediatamente. Una denegación o error de verificación retira el acceso. |
| Actualizaciones de catálogo retiraban formularios aunque sus datos ya estuvieran disponibles. | Guardas de carga en `src/app/admin/plato.tsx`, `src/app/reservar.tsx` y `src/app/reserva-formulario.tsx`. El coordinador conserva el catálogo público durante una actualización. No se cambiaron estilos ni productos. |
| Una escritura administrativa pendiente podía continuar después de cambiar de usuario. | `src/state/restaurant-store.tsx`, `adminMutation`, comprueba nuevamente la identidad y el permiso local tras esperar la comprobación remota. RLS sigue siendo la protección del servidor. |
| Dos referencias a `Buffer` sin importar producían errores de ESLint. | `tests/svg-data-uri.test.mjs` importa `Buffer` desde `node:buffer`. |
| La comprobación habitual de lint no incluía todos los tests. | `package.json`: `lint` ejecuta `eslint . --no-cache`; añadidos `test` y `typecheck`. |

Las validaciones y la creación se extrajeron del proveedor a un módulo usado por la aplicación y las pruebas. Los argumentos de `crear_reserva`, `consultar_ocupacion` y `verificar_acceso_admin` permanecen iguales. Se endureció la comprobación del UUID devuelto para rechazar referencias malformadas.

## Comandos y resultados reales

Ejecutados desde la raíz del proyecto. En PowerShell se utilizó `npm.cmd`; en otros terminales pueden invocarse como `npm`.

| Comando final | Resultado |
| --- | --- |
| `npm.cmd run typecheck` → `tsc --noEmit` | Código de salida 0; sin errores de TypeScript. |
| `npm.cmd run lint` → `eslint . --no-cache` | Código de salida 0; sin errores ni advertencias de ESLint. Incluye producción, pruebas y configuración, respetando las exclusiones existentes. |
| `npm.cmd test` → `node --test tests/*.test.mjs` | Código de salida 0; **60 aprobadas, 0 fallidas, 0 canceladas, 0 omitidas y 0 pendientes**. |
| `git diff --check` | Código de salida 0; sin errores de espacios. Git advierte sobre conversión LF/CRLF en algunos archivos de Windows. |
| `git diff --name-only -- package-lock.json src/lib/supabase.ts src/types/database.ts supabase README.md .gitignore .env.example` | Sin diferencias en esos archivos protegidos. |

Durante el desarrollo también se ejecutaron pruebas y ESLint de los archivos nuevos individualmente; la ejecución completa anterior incluye todos ellos.

Node muestra el aviso **`MODULE_TYPELESS_PACKAGE_JSON`** al importar algunos módulos TypeScript: detecta su sintaxis ES module y los vuelve a interpretar. No impide las pruebas. No se cambió el modo de módulos del proyecto para ocultar el aviso. Las pruebas usan funciones de Node 24 y se verificaron con la versión indicada; no se comprobó su ejecución con versiones anteriores.

## Qué prueban los 60 casos

| Archivo | Casos | Código y comportamiento comprobados |
| --- | ---: | --- |
| `tests/availability.test.mjs` | 12 | Funciones reales `availableTimes`, `parseOccupancy`, `normalizeTime`, `weekday` e `isoDay`: días ISO, horas de Colombia, cambio de fecha UTC, franjas completas, solapamientos y límites contiguos, fechas y respuestas inválidas. |
| `tests/create-reservation.test.mjs` | 22 | Flujo real `createReservationAction`, `fetchOccupancy` y `errorMessage`: capacidad, nombre/contacto, jornada/fecha/hora, reloj después de esperar la consulta, argumentos RPC, UUID, errores y conflictos, envío doble y recuperación. Incluye tres regresiones combinadas con el coordinador real: actualización de lista/conteo, rechazo de respuesta obsoleta, acceso público y fallo de recarga posterior a una reserva exitosa. |
| `tests/restaurant-sync.test.mjs` | 14 | Coordinador real: carreras entre Auth y refresh, renovación del mismo usuario, revocación, cambio/cierre de sesión, respuestas tardías, catálogo público, errores y ciclo de activación. |
| `tests/admin-form.test.mjs` | 3 | Ramas reales de `DishScreen`, conservando tipo y clave del formulario durante una carga con datos disponibles. No monta el formulario en un teléfono ni simula interacción nativa. |
| `tests/reservations.test.mjs` | 7 | Pruebas históricas de utilidades, incluyendo fechas compartidas y lógica de reservas de demostración. **No acreditan el flujo Supabase ni la prevención de conflictos en PostgreSQL.** |
| `tests/layout-hydration.test.mjs` | 1 | HTML inicial del hook real de ancho adaptable ante distintos tamaños. No es una hidratación completa en un navegador. |
| `tests/svg-data-uri.test.mjs` | 1 | Codificación Base64/UTF-8 del SVG real. No acredita su visualización en Android. |
| **Total** | **60** | **51 casos nuevos sobre código de producción y 9 casos existentes.** |

Los tests nuevos importan el código que utiliza `RestaurantProvider`; no reimplementan sus algoritmos. Se simulan las dependencias externas: cliente Supabase, reloj, resultados de permisos y carga de datos. `tests/helpers/register-typescript.mjs` resuelve rutas de TypeScript para Node; la prueba de pantalla utiliza el TypeScript ya instalado para transpilar TSX. No se cargan las credenciales del cliente real.

## Revisión de credenciales

- `git check-ignore -v .env.local` confirmó la regla `.gitignore:34`, `.env*.local`.
- `git ls-files '*env*'` devolvió únicamente `.env.example`, con valores de ejemplo. No se abrió ni se imprimió el contenido de `.env.local`.
- Se inspeccionaron los cuatro commits locales y 109 blobs de texto únicos mediante patrones de claves privadas, secretos Supabase, JWT literales, contraseñas en URI PostgreSQL y tokens GitHub/AWS: **cero coincidencias**. `.env.local` no apareció en ese historial.
- Es una comprobación local por patrones, no una garantía exhaustiva de ausencia de secretos ni una inspección remota de todas las ramas de GitHub, sus registros o artefactos.

## Limitaciones y pruebas manuales pendientes

Todos los puntos siguientes permanecen **PENDIENTES tras estos cambios**. Las pruebas con dependencias simuladas no demuestran que RLS, las RPC o las transacciones del servidor estén configuradas correctamente.

| Prioridad | Prueba manual | Resultado esperado |
| --- | --- | --- |
| Alta | En iPhone/Expo Go y web, iniciar sesión como administrador, reservar desde Inicio y volver a Admin/Reservas con filtros que incluyan la nueva reserva. | Confirmación correcta; listado y contador actualizados sin cerrar sesión ni recargar la aplicación. |
| Alta | Escribir sin guardar en plato, jornada y formulario del cliente; dejar renovar la sesión y volver del segundo plano o de otra pestaña. | Se conservan valores, controles y foco cuando el permiso sigue vigente; no queda bloqueado en «Verificando sesión». |
| Alta | Actualizar datos mientras se inicia/cierra sesión o se cambia de usuario. | No reaparecen reservas privadas de la sesión anterior; los indicadores terminan y se aplican los permisos del usuario actual. |
| Alta | Revisar acceso con sesión ausente y con una cuenta existente sin permiso administrativo. | Rutas y escrituras administrativas denegadas; no lectura pública directa de reservas ni datos personales en ocupación. No modificar RLS para realizar esta prueba. |
| Alta | En un entorno autorizado de pruebas, intentar reservar simultáneamente la misma mesa y franja desde dos dispositivos. | Una única reserva confirmada; la otra operación informa conflicto. La prueba local de doble envío no demuestra atomicidad en PostgreSQL. |
| Alta | Comprobar pérdida de red durante ocupación, durante creación y después de una creación exitosa. | Errores claros, aviso de resultado incierto cuando corresponda, confirmación conservada tras fallo de recarga y ausencia de reintentos automáticos de creación. |
| Alta | Cerrar y volver a abrir Expo Go/web; comprobar persistencia y renovación reales de Supabase Auth. | Sesión restaurada y autorización revalidada sin pérdida injustificada del formulario. |
| Media | Probar capacidad máxima y excedida, día sin jornada, franja pasada, contacto vacío y horario contiguo, usando hora de Colombia. | Validaciones coherentes entre interfaz y RPC. |
| Media | Abrir web desde cero y navegar por cliente y administración revisando la consola. | Sin errores de hidratación o navegación; formularios y diseño adaptables. |
| Media | Verificar ilustraciones y recorridos en iPhone; Android si forma parte de la entrega. | Renderizado e interacción correctos. No se generó ni se probó APK en esta intervención. |

Para iniciar estas revisiones con las dependencias ya presentes: `npm run start` para Expo Go y `npm run web` para web. Usar únicamente datos de prueba autorizados para las comprobaciones que crean reservas. Registrar después el dispositivo, versión, fecha, resultado observado y evidencias reales; este archivo no contiene capturas inventadas.

Antes de entregar, el equipo debe revisar el diff, completar las pruebas manuales de prioridad alta y decidir cuándo publicar el quinto commit. Esta intervención no realizó commit ni push.
