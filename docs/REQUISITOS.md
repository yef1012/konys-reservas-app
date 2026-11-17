# KONYS PIZZA — Requisitos y trazabilidad

**Entrega:** 16 de noviembre de 2026.
**Institución:** Corporación Universitaria de Ciencia y Desarrollo – UNICIENCIA.
**Programa y asignatura:** Ingeniería de Sistemas — Programación Móvil.
**Integrantes:** Yefry Fernando Amaya Barbosa y Andrés David Pérez Pardo.
**Docente:** Carlos Carrascal.

## Estado de la guía oficial

**Correspondencia con los 14 requisitos funcionales: PENDIENTE DE VERIFICAR.**

En la revisión del repositorio no se encontró una guía oficial del profesor, rúbrica ni documento con el texto y los códigos de esos 14 requisitos. Se inspeccionaron el [README](../README.md), [PRUEBAS.md](PRUEBAS.md), los archivos de código y el inventario de documentos Markdown, texto, PDF y Word disponibles. `AGENTS.md` contiene instrucciones técnicas de desarrollo; no es la guía académica.

Por tanto, no se presenta una matriz oficial de 14 filas ni se asignan códigos supuestos. El número 14 procede de la solicitud del equipo; no permite deducir los enunciados, su orden ni sus criterios de aceptación. La tabla siguiente registra funcionalidades observables en el proyecto, sin sustituir esa matriz ni declarar cumplimiento de la guía ausente.

| Fuente necesaria | Estado | Acción para cerrar la correspondencia |
| --- | --- | --- |
| Guía oficial y versión/fecha | No localizada en el repositorio | Incorporar el documento o su enlace verificable. |
| Texto, código y criterios de los 14 requisitos | Pendiente de verificar | Transcribir los identificadores y enunciados de la guía cuando esté disponible; no deducirlos del código. |
| Relación entre requisitos y evidencias | Pendiente de verificar | Vincular cada requisito oficial con las rutas, funciones y pruebas correspondientes; señalar los casos sin evidencia. |
| Evaluación académica final | No verificable con las fuentes actuales | Contrastar entregables, criterios y alcance con el profesor o la guía antes de afirmar cumplimiento total. |

## Inventario funcional observado, sin códigos oficiales

«Implementado» indica que se identificó el flujo en el código actual. «Probado localmente» se limita a los casos automatizados descritos en [PRUEBAS.md](PRUEBAS.md), que simulan las dependencias externas. No equivale a verificar las RPC, las políticas remotas ni la aplicación completa en un dispositivo.

| Funcionalidad del proyecto | Evidencia en el código | Estado y límite de la evidencia | Correspondencia oficial |
| --- | --- | --- | --- |
| Acceso del cliente y consulta de mesas por zona, capacidad y habilitación | [index.tsx](../src/app/index.tsx), `HomeScreen`; [restaurant.ts](../src/services/restaurant.ts), `loadRestaurant` y `mapTable` | Implementado sin registro de clientes. `activa` se convierte en habilitada o mantenimiento; no representa ocupación instantánea. La disponibilidad depende de fecha y hora. | Pendiente de verificar |
| Selección de mesa, fecha y jornada | [reservar.tsx](../src/app/reservar.tsx), `ReserveScreen` | Implementado; limita las jornadas al día seleccionado. Recorrido interactivo de la versión actual pendiente en móvil/web. | Pendiente de verificar |
| Consulta de horarios y exclusión de solapamientos | [use-availability.ts](../src/hooks/use-availability.ts), `useAvailability`; [availability.ts](../src/utils/availability.ts), `availableTimes` y `parseOccupancy`; [restaurant.ts](../src/services/restaurant.ts), `fetchOccupancy` | Código de producción probado localmente: franjas completas, límites contiguos, fecha/hora de Colombia y respuestas inválidas. Consulta remota y exclusión concurrente en PostgreSQL pendientes de verificar. | Pendiente de verificar |
| Formulario y validación de capacidad y datos del cliente | [reserva-formulario.tsx](../src/app/reserva-formulario.tsx), `ReservationFormScreen`; [create-reservation.ts](../src/services/create-reservation.ts), `createReservationAction` | Implementado y probado localmente en el flujo de producción: nombre, personas enteras dentro de la capacidad y contacto opcional. Validación equivalente del servidor no comprobada en esta revisión. | Pendiente de verificar |
| Creación de reserva y tratamiento de errores | [create-reservation.ts](../src/services/create-reservation.ts), `createReservationAction`; [restaurant-store.tsx](../src/state/restaurant-store.tsx), adaptador `reserve` | Se vuelve a consultar ocupación y se llama exclusivamente a `crear_reserva`; se bloquea el doble envío local y se exige un UUID válido. Las pruebas simulan conflicto y pérdida de conexión. Atomicidad entre dispositivos pendiente. | Pendiente de verificar |
| Confirmación y referencia de reserva | [confirmacion.tsx](../src/app/confirmacion.tsx), `ConfirmationScreen` | Muestra detalles disponibles en memoria y referencia. Una recarga o un enlace en otro dispositivo no permiten al cliente recuperar ni verificar públicamente los datos de la reserva. No se implementa un historial de cliente. | Pendiente de verificar |
| Carta digital por categorías | [carta.tsx](../src/app/carta.tsx); [restaurant.ts](../src/services/restaurant.ts), `loadRestaurant` y `mapDish` | Implementada con pizzas, entradas, postres y bebidas; el cliente consulta platos disponibles. Incluye aviso de precios de referencia de Rappi. Contenido vigente de la tabla remota no auditado aquí. | Pendiente de verificar |
| Autenticación y acceso administrativo | [restaurant-store.tsx](../src/state/restaurant-store.tsx), `login`, `verifySession` y `adminMutation`; [admin/_layout.tsx](../src/app/admin/_layout.tsx); [restaurant-sync.ts](../src/state/restaurant-sync.ts) | Correo/contraseña con Supabase Auth y consulta de `verificar_acceso_admin`. Coordinación de sesión y rechazo de respuestas obsoletas probados con dependencias simuladas. Permisos RLS reales y persistencia en dispositivos pendientes. | Pendiente de verificar |
| Administración de mesas | [admin/mesas.tsx](../src/app/admin/mesas.tsx); [admin/nueva-mesa.tsx](../src/app/admin/nueva-mesa.tsx); [restaurant-store.tsx](../src/state/restaurant-store.tsx), `addTable` y `updateTableStatus` | Listado, alta y habilitación/mantenimiento implementados. No se atribuye edición general o eliminación de mesas que no figure en estas acciones. Escritura remota pendiente de prueba documentada. | Pendiente de verificar |
| Administración de jornadas y duración | [admin/horarios.tsx](../src/app/admin/horarios.tsx); [shift-editor.tsx](../src/components/admin/shift-editor.tsx); [restaurant-store.tsx](../src/state/restaurant-store.tsx), `saveShift` | Alta/edición, día de semana, inicio/fin, duración y habilitación implementados. El contrato usa días ISO 1–7 y el modelo de interfaz 0–6. No se presuponen jornadas que atraviesen medianoche. | Pendiente de verificar |
| Administración de reservas | [admin/reservas.tsx](../src/app/admin/reservas.tsx), `AdminReservationsScreen`; [restaurant-store.tsx](../src/state/restaurant-store.tsx), `updateReservationStatus` | Filtros por fecha, mesa y estado; cancelación y finalización de reservas confirmadas. Actualización de listado/conteo tras crear probada con el flujo real y dependencias simuladas. Recorrido remoto pendiente. | Pendiente de verificar |
| Administración de la carta | [admin/carta.tsx](../src/app/admin/carta.tsx); [admin/plato.tsx](../src/app/admin/plato.tsx); [restaurant-store.tsx](../src/state/restaurant-store.tsx), `saveDish` y `toggleDish` | Alta, edición y visibilidad implementadas. Una prueba de la pantalla comprueba la conservación del tipo y clave del formulario durante una carga; no sustituye una interacción real. | Pendiente de verificar |

## Aspectos técnicos y alcance

La navegación inferior ofrece Inicio, Carta y Admin. Hay componentes compartidos, adaptación por ancho, avisos de carga/error y reintentos. El código usa fecha/hora de Colombia y separa las consultas públicas de la carga administrativa. Son decisiones observadas, no requisitos no funcionales oficiales ni una certificación de accesibilidad, rendimiento o seguridad.

El [README](../README.md) delimita el alcance: reservas, carta y administración. No se incluyen pagos, pedidos a domicilio, notificaciones push ni publicación en tiendas. Tampoco se presupone autenticación de clientes, gestión de pedidos o recuperación pública del comprobante completo.

## Evidencias y cierre de entrega

- Las comprobaciones locales del 16 de noviembre están registradas en [PRUEBAS.md](PRUEBAS.md): TypeScript, ESLint completo y 60 pruebas automatizadas. Las pruebas históricas de demostración se distinguen de las pruebas del flujo de producción.
- El README informa una prueba previa en iPhone/Expo Go. No se transforma ese antecedente en evidencia de todos los cambios o dispositivos actuales.
- Se identificaron cinco commits locales, con `170929c` como último al iniciar esta revisión. Su existencia local no demuestra por sí sola la publicación o accesibilidad en GitHub.
- La configuración `preview` de [eas.json](../eas.json) solicita un APK, pero no se localizó un archivo APK/AAB ni un enlace de descarga en los documentos revisados. Compilación, instalación y demostración Android permanecen pendientes de evidencia.
- Los enlaces y evidencias de mockups se organizan en [DISENO.md](DISENO.md); la grabación se prepara en [GUION_VIDEO.md](GUION_VIDEO.md). No se adjuntaron capturas ni un video inexistentes.

Para completar la matriz oficial se necesitan la guía, sus 14 enunciados y sus criterios de aceptación. Para cerrar la validación funcional se necesitan las pruebas manuales prioritarias de [PRUEBAS.md](PRUEBAS.md), con fecha, dispositivo, resultado y evidencia reales.
