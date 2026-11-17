# Arquitectura de KONYS PIZZA

**Entrega:** 16 de noviembre de 2026.
**Institución:** Corporación Universitaria de Ciencia y Desarrollo – UNICIENCIA.
**Programa y asignatura:** Ingeniería de Sistemas · Programación Móvil.
**Integrantes:** Yefry Fernando Amaya Barbosa y Andrés David Pérez Pardo.
**Docente:** Carlos Carrascal.

## 1. Alcance y nivel de evidencia

KONYS PIZZA permite consultar mesas, reservar una franja horaria, consultar la carta y administrar mesas, jornadas, reservas y platos. Esta descripción procede del código actual, del [README](../README.md) y del registro de [pruebas](PRUEBAS.md). La revisión documental del 16 de noviembre identifica el quinto commit local `170929c`; su existencia local no demuestra por sí sola su publicación en GitHub.

Se distinguen tres niveles:

- **Implementado:** comprobado mediante lectura del código y archivos de configuración.
- **Probado localmente:** comportamiento cubierto por las pruebas y resultados descritos en `PRUEBAS.md`, con dependencias externas simuladas cuando corresponde.
- **Pendiente de verificar:** comportamiento del servidor Supabase, políticas efectivas, compilaciones y funcionamiento posterior a los últimos cambios en dispositivos reales. El README y el equipo informan pruebas previas en iPhone/Expo Go; no equivalen a una nueva prueba de esta revisión.

## 2. Componentes y responsabilidades

| Capa | Implementación y responsabilidad | Evidencia |
| --- | --- | --- |
| Aplicación | React Native, Expo SDK 58 y TypeScript. La misma base contiene las pantallas para móvil y web. Node.js se utiliza para herramientas y pruebas; el repositorio no implementa un servidor propio de negocio con Express u otra API Node. | [package.json](../package.json), [app.json](../app.json). |
| Navegación | Expo Router, con archivos de ruta en `src/app/`, un `Stack` raíz y una barra inferior personalizada. | [RootLayout y AppShell](../src/app/_layout.tsx). |
| Presentación compartida | Componentes de pantallas, tarjetas, campos, botones, avisos, iconos e ilustraciones; estilos y colores centralizados. | [ui.tsx](../src/components/konys/ui.tsx), [icon.tsx](../src/components/konys/icon.tsx), [product-art.tsx](../src/components/konys/product-art.tsx), [konys.ts](../src/constants/konys.ts). |
| Estado y acciones | `RestaurantProvider` comparte catálogo, sesión, permisos, confirmación y operaciones. `createRestaurantSync` coordina cargas y descarta respuestas obsoletas. | [restaurant-store.tsx](../src/state/restaurant-store.tsx), [restaurant-sync.ts](../src/state/restaurant-sync.ts). |
| Servicios | `loadRestaurant` consulta y transforma filas; `fetchOccupancy` consulta ocupación; `errorMessage` traduce errores conocidos. `createReservationAction` realiza el flujo de validación y creación. | [restaurant.ts](../src/services/restaurant.ts), [create-reservation.ts](../src/services/create-reservation.ts). |
| Disponibilidad y fechas | `useAvailability` consulta al cambiar mesa, fecha o jornada y cancela solicitudes anteriores. Las utilidades validan fechas, normalizan horas y calculan franjas. | [use-availability.ts](../src/hooks/use-availability.ts), [availability.ts](../src/utils/availability.ts), [reservations.ts](../src/utils/reservations.ts). |
| Acceso externo | Cliente reutilizable de Supabase para Auth, consultas de tablas y llamadas RPC. | [supabase.ts](../src/lib/supabase.ts). |
| Contratos | Tipos de filas del servidor y modelos usados por la interfaz. Son contratos de la aplicación, no una inspección automática del esquema remoto. | [database.ts](../src/types/database.ts), [restaurant.ts](../src/types/restaurant.ts). |

La ruta principal monta `RestaurantProvider`. Los archivos históricos `src/data/demo.ts`, `src/state/demo-store.tsx` y parte de `src/utils/reservations.ts` permanecen en el repositorio, pero el proveedor de demostración no se monta en el layout raíz. Un error de Supabase no activa datos demo como alternativa silenciosa.

## 3. Pantallas y navegación

La barra inferior tiene **Inicio**, **Carta** y **Admin**, enlazados a `/`, `/carta` y `/admin`. Los pasos de reserva se abren desde Inicio. Las rutas administrativas comparten una comprobación de sesión y permisos en [AdminLayout](../src/app/admin/_layout.tsx).

| Ruta | Pantalla y función | Archivo |
| --- | --- | --- |
| `/` | Mesas, filtro por zona, capacidad y acceso a reserva. | [index.tsx](../src/app/index.tsx) |
| `/reservar` | Selección de mesa, fecha, jornada y franja disponible. | [reservar.tsx](../src/app/reservar.tsx) |
| `/reserva-formulario` | Nombre, personas y contacto opcional; validación y envío. | [reserva-formulario.tsx](../src/app/reserva-formulario.tsx) |
| `/confirmacion` | Comprobante en memoria y referencia de reserva. | [confirmacion.tsx](../src/app/confirmacion.tsx) |
| `/carta` | Platos visibles por pizzas, entradas, postres y bebidas. Incluye aviso sobre precios de referencia de Rappi. | [carta.tsx](../src/app/carta.tsx) |
| `/admin` | Acceso con correo/contraseña o panel, según sesión y permisos. | [admin/index.tsx](../src/app/admin/index.tsx) |
| `/admin/mesas` | Listado y activación/desactivación de mesas. | [admin/mesas.tsx](../src/app/admin/mesas.tsx) |
| `/admin/nueva-mesa` | Alta de mesa con nombre, zona y capacidad. | [admin/nueva-mesa.tsx](../src/app/admin/nueva-mesa.tsx) |
| `/admin/horarios` | Jornadas por día, horas, duración y estado activo. | [admin/horarios.tsx](../src/app/admin/horarios.tsx) |
| `/admin/reservas` | Filtros por fecha, mesa y estado; cancelación o finalización. | [admin/reservas.tsx](../src/app/admin/reservas.tsx) |
| `/admin/carta` | Listado administrativo; mostrar/ocultar y abrir edición. | [admin/carta.tsx](../src/app/admin/carta.tsx) |
| `/admin/plato` | Formulario compartido de alta y edición, con parámetro `id` al editar. | [admin/plato.tsx](../src/app/admin/plato.tsx) |

La selección viaja entre rutas mediante parámetros; al confirmar se navega con el UUID devuelto. Los detalles del comprobante del cliente se conservan en memoria, no se consultan públicamente por UUID. Después de recargar o abrir el enlace en otro dispositivo, la pantalla puede mostrar únicamente la referencia y explica que no verifica su estado. La aplicación no incluye cuentas de clientes, pagos, domicilios ni notificaciones.

## 4. Flujo de una reserva

1. `loadRestaurant(false)` obtiene mesas activas, horarios activos y platos disponibles. No consulta directamente `reservas` para el cliente sin permiso administrativo.
2. `useAvailability` solicita `consultar_ocupacion` para una mesa y fecha. `parseOccupancy` exige intervalos válidos con `hora_inicio` y `hora_fin`; una respuesta inválida produce un error, no disponibilidad inventada.
3. `availableTimes` genera únicamente franjas completas dentro de la jornada seleccionada. Excluye el pasado y cualquier solapamiento; permite que una reserva termine exactamente cuando comienza otra.
4. `createReservationAction` valida mesa, fecha, nombre, número entero de personas, capacidad y contacto. Vuelve a consultar ocupación y a comprobar el reloj antes de enviar la reserva.
5. La creación se realiza exclusivamente mediante `crear_reserva`, conservando su contrato existente. El bloqueo local evita dos envíos simultáneos desde la misma acción, pero no sustituye las validaciones y transacciones del servidor.
6. Tras recibir un UUID válido, se guarda la confirmación y se actualizan los datos mediante `refresh`. Si falla esa actualización, una reserva ya confirmada mantiene su resultado exitoso. Si la respuesta de creación se pierde por un error de conexión, se avisa que la reserva podría haberse registrado y no se reintenta automáticamente.

La prevención de conflictos entre dos dispositivos depende de la implementación remota de `crear_reserva`. Su atomicidad no se acredita con pruebas de JavaScript ni se verificó consultando Supabase en esta revisión.

## 5. Modelo de datos consumido

Los campos siguientes corresponden al contrato de [database.ts](../src/types/database.ts) y a las consultas del servicio. La existencia y definición remota de restricciones, índices y claves foráneas requieren comprobación aparte.

| Tabla pública | Campos utilizados por el contrato | Uso |
| --- | --- | --- |
| `mesas` | `id`, `nombre`, `zona`, `capacidad`, `activa`, `foto_url`, `creado_en` | Catálogo de mesas y gestión administrativa. |
| `horarios` | `id`, `dia_semana`, `jornada`, `hora_inicio`, `hora_fin`, `duracion_slot`, `activo` | Jornadas semanales y duración de las reservas. |
| `reservas` | `id`, `mesa_id`, `cliente_nombre`, `cliente_contacto`, `num_personas`, `fecha`, `hora_inicio`, `hora_fin`, `estado`, `creado_en` | Reservas creadas por RPC; consulta y cambios de estado administrativos. |
| `platos` | `id`, `nombre`, `categoria`, `descripcion`, `precio`, `disponible` | Carta pública y administración de platos. |

`reservas.mesa_id` identifica la mesa asociada en el modelo de aplicación. No hay una columna `shiftId` en el contrato de reservas: ese identificador pertenece a la selección local. Al leer una reserva existente, `mapReservation` calcula su duración a partir de las horas guardadas. El comprobante recién creado usa la duración de la jornada seleccionada, porque la RPC devuelve únicamente el UUID.

El estado de una mesa en el servidor se representa con `activa`, no con una columna `estado`. `mapTable` convierte ese booleano en `disponible` o `mantenimiento` para la interfaz. Una mesa habilitada no garantiza que esté libre en toda fecha y hora: esa disponibilidad se obtiene mediante ocupación. Los estados de reserva reconocidos son `confirmada`, `cancelada` y `completada`; una reserva finalizada no se reactiva desde la aplicación.

## 6. Contratos RPC

| Función | Argumentos enviados | Respuesta esperada y uso |
| --- | --- | --- |
| `consultar_ocupacion` | `p_mesa_id`, `p_fecha` | Lista de intervalos `hora_inicio`/`hora_fin`; se procesa sin requerir nombres o contactos de clientes. |
| `crear_reserva` | `p_mesa_id`, `p_cliente_nombre`, `p_num_personas`, `p_fecha`, `p_hora_inicio`, `p_cliente_contacto` | UUID de la reserva creada. El contacto vacío se envía como `null`. |
| `verificar_acceso_admin` | Sin argumentos | Booleano que decide si puede cargarse y utilizarse el módulo administrativo. |

El repositorio contiene [verificar_acceso_admin.sql](../supabase/verificar_acceso_admin.sql): una función pública con `SECURITY INVOKER`, `search_path` vacío y ejecución concedida a `authenticated`, que delega en `app_private.es_admin()`. No incluye el cuerpo completo de las otras dos RPC ni todas las definiciones del esquema y de RLS. El archivo SQL disponible no demuestra que su versión esté aplicada en el servidor.

El script [reemplazar_carta_demo.sql](../supabase/reemplazar_carta_demo.sql) es un recurso de sustitución controlada de productos demo; no es una migración completa de la base. No se ejecutó ni se modificó al preparar esta documentación.

## 7. Autenticación, autorización y sesión

- **Acceso administrativo:** `login` utiliza `signInWithPassword`; no se utiliza el PIN demo. `verifySession` verifica el usuario con `getUser` y consulta `verificar_acceso_admin`. Una sesión existente no basta para conceder acceso.
- **Modelo de autorización informado por el equipo:** el usuario administrador está registrado en `app_private.admin_users`, columna `user_id`, relacionada con `auth.users`. La función privada `app_private.es_admin()` comprueba esa pertenencia; las políticas usan `USING ((SELECT app_private.es_admin()))` y `WITH CHECK ((SELECT app_private.es_admin()))`. Esta configuración fue descrita por el equipo; la revisión local no confirma su estado actual en Supabase.
- **Consultas y escrituras:** `loadRestaurant(true)` carga reservas únicamente después de la validación administrativa. `adminMutation` vuelve a consultar el permiso y comprueba que no cambió el usuario antes de escribir. `Insert: never` en el tipo de reservas ayuda al desarrollo, pero el límite de seguridad real debe estar en RLS y las RPC del servidor.
- **Persistencia configurada:** el cliente emplea AsyncStorage en plataformas nativas; en web utiliza la persistencia del cliente Supabase. Durante el renderizado en servidor se desactivan persistencia y renovación. Las variables públicas se leen por nombre desde el entorno, sin valores incorporados a esta documentación.
- **Renovación y sincronización:** los eventos de Auth difieren las consultas fuera del callback. En móvil, `AppState` inicia o detiene la renovación automática. El coordinador conserva formularios y datos del mismo usuario mientras revalida; una identidad distinta invalida respuestas pendientes y borra datos privados. Ante denegación o error de autorización se retira el acceso.
- **Secretos:** la aplicación exige una URL HTTPS y una clave con prefijo `sb_publishable_`. No incorpora `service_role` ni contraseñas de base de datos. Las variables `EXPO_PUBLIC_` son públicas; la protección de datos depende de los permisos efectivos del servidor, no de ocultar esa clave.

Se requiere una comprobación manual con usuario autorizado, usuario sin permisos y sesión ausente para acreditar la protección remota. No se desactivó RLS ni se consultaron credenciales privadas para redactar este documento.

## 8. Fechas, carga, errores y compatibilidad

`todayISO` y `formatDate` usan `America/Bogota`; las fechas de selección se conservan como `AAAA-MM-DD`. `availableTimes` compara las franjas con el desplazamiento `-05:00`. Supabase utiliza días ISO de 1 (lunes) a 7 (domingo); `mapShift` e `isoDay` convierten esa convención al modelo local. Los horarios aceptan precisión de minutos; no se ofrecen jornadas que crucen medianoche.

Las consultas de mesas, jornadas y platos se ejecutan en paralelo. El listado administrativo de reservas se descarga en páginas de 500 filas y sus filtros se aplican en memoria. No hay una suscripción Realtime implementada: los cambios de otros dispositivos no se reciben automáticamente; deben recargarse los datos. La capa de red incorpora un límite de 15 segundos por solicitud y las consultas de disponibilidad pueden abortarse cuando cambia la selección.

Los avisos de carga y error se muestran mediante componentes compartidos. El diseño contempla móvil y web; `useLayoutWidth` proporciona un valor inicial estable para el renderizado web. La configuración actual declara `web.output: "server"`, por lo que no debe describirse la web como una exportación exclusivamente estática.

En [eas.json](../eas.json) existe un perfil `preview` configurado para APK, y [app.json](../app.json) contiene configuración Android. Ambos tenían cambios locales previos a esta documentación. La configuración no acredita una compilación exitosa, un enlace de descarga válido ni una instalación probada; esos puntos deben registrarse con evidencias reales.

## 9. Verificación y pendientes

Consultar [PRUEBAS.md](PRUEBAS.md) para comandos, resultados y límites. Sus pruebas de funciones de producción utilizan dependencias simuladas; las pruebas históricas de demostración se identifican por separado. Un resultado automatizado correcto no demuestra por sí solo hidratación en navegador, persistencia de sesión en Expo Go, calidad visual en Android ni protección efectiva de la base.

Antes de acreditar la entrega deben completarse las pruebas manuales prioritarias: creación y actualización de listado, renovación con formularios abiertos, cierre/cambio de sesión, acceso denegado, dos reservas simultáneas contra el servidor y revisión del APK si se entrega. El inventario visual y los espacios de evidencias están en [DISENO.md](DISENO.md); la correspondencia con la guía oficial se trata en [REQUISITOS.md](REQUISITOS.md).
