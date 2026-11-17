# Diseño de la interfaz de KONYS PIZZA

**Entrega:** 16 de noviembre de 2026.
**Institución:** Corporación Universitaria de Ciencia y Desarrollo – UNICIENCIA.
**Programa y asignatura:** Ingeniería de Sistemas · Programación Móvil.
**Integrantes:** Yefry Fernando Amaya Barbosa y Andrés David Pérez Pardo.
**Docente:** Carlos Carrascal.

## Alcance y evidencia

Este documento describe el diseño implementado en el código del proyecto. No es una certificación de correspondencia con los mockups ni de compatibilidad visual en todos los dispositivos. El [README](../README.md) informa pruebas previas en iPhone mediante Expo Go; la revisión documental del 16 de noviembre no incluyó una nueva inspección visual en un teléfono o navegador. Las comprobaciones automatizadas y sus límites se describen en [PRUEBAS.md](PRUEBAS.md).

Referencia de diseño proporcionada por el equipo: [archivo de Figma de KONYS PIZZA](https://www.figma.com/design/806IGdyG1UszxCUV8fIIyZ). Su contenido y permisos de acceso no se comprobaron durante esta documentación. Los enlaces directos a cada frame y las capturas reales quedan pendientes de incorporar; no se generaron imágenes para presentarlas como evidencias.

## Identidad visual implementada

La fuente principal de los valores de diseño es [src/constants/konys.ts](../src/constants/konys.ts).

| Elemento | Valor o tratamiento en el código | Uso |
| --- | --- | --- |
| Azul petróleo | `#073847`; tono profundo `#052E3A` | Identidad, textos destacados, cabeceras y bloques de presentación. |
| Naranja | `#F47A20` | Acciones principales y acentos de marca. |
| Fondo claro y tarjetas | `#F6F8F8` y `#FFFFFF` | Separación entre el fondo general y las superficies de contenido. |
| Texto y texto secundario | `#17323B` y `#5A7078` | Jerarquía de lectura y descripciones. |
| Bordes | `#DEE7E9` | Separación de tarjetas y campos. |
| Éxito y error | `#21684D` y `#AB3439`, con fondos suaves | Avisos y estados acompañados de texto; no dependen únicamente del color. |
| Tipografía compartida | Título 30/37, subtítulo 21/28, cuerpo 15/24, etiqueta 14/21 y texto breve 12/19 | Tamaño/interlineado definidos en estilos de React Native; algunas pantallas ajustan los títulos. |
| Espaciado | 4, 8, 12, 16, 24 y 32 | Separación consistente entre elementos. |
| Esquinas | Radios 10, 16, 24, 32 y forma de píldora | Tarjetas, botones, campos y filtros. |

Los elementos reutilizables están en [src/components/konys/ui.tsx](../src/components/konys/ui.tsx): `Screen`, `AppText`, `Card`, `Row`, `Section`, `Button`, `Chip`, `Field`, `Badge`, `Notice` y `EmptyState`. Su reutilización mantiene la misma presentación de cargas, errores, campos y acciones en cliente y administración.

## Navegación y estructura común

[src/app/_layout.tsx](../src/app/_layout.tsx) contiene el contenedor común, la marca, el área de navegación y la barra inferior con **Inicio**, **Carta** y **Admin**. Las pantallas se organizan con Expo Router y un `Stack`; la barra inferior es una implementación de botones de navegación, no tres aplicaciones separadas.

El recorrido de reserva conecta Inicio, selección de mesa/fecha/horario, formulario y confirmación. La carta puede abrirse desde la barra inferior, Inicio o la confirmación. Los botones «Volver» usan el historial cuando existe y una ruta alternativa cuando no existe.

[src/app/admin/_layout.tsx](../src/app/admin/_layout.tsx) controla el acceso visual a las rutas administrativas: muestra verificación de sesión y redirige al acceso cuando falta permiso. Los dos archivos `_layout.tsx` son contenedores de navegación; **no se cuentan como pantallas independientes** del inventario.

## Inventario de pantallas del cliente

| Pantalla y ruta | Archivo y componente | Elementos principales | Estados y observaciones |
| --- | --- | --- | --- |
| Inicio `/` | [index.tsx](../src/app/index.tsx), `HomeScreen` | Presentación de marca, ilustración, botón de reserva, jornadas de hoy, filtro por zona, tarjetas de mesa con nombre/zona/capacidad/estado y acceso a carta. | Carga, error con reintento, ausencia de mesas o de jornadas. Una mesa habilitada no garantiza un horario libre: la disponibilidad se consulta para la fecha elegida. |
| Selección `/reservar` | [reservar.tsx](../src/app/reservar.tsx), `ReserveScreen` | Pasos de reserva, selección de mesa, fecha, jornada y franja, resumen y botón para continuar. | Selección inválida, mesa no disponible, consulta de ocupación, error, ausencia de franjas y horario seleccionado. Una actualización con datos disponibles no sustituye todo el contenido por la carga inicial. |
| Datos del cliente `/reserva-formulario` | [reserva-formulario.tsx](../src/app/reserva-formulario.tsx), `ReservationFormScreen` | Resumen de mesa/fecha/hora, nombre, cantidad de personas, contacto opcional y confirmación. | Errores de nombre/capacidad, verificación de disponibilidad, envío pendiente y reserva enviada. Se deshabilitan acciones durante el envío y se informa si el horario ya no está disponible. |
| Confirmación `/confirmacion` | [confirmacion.tsx](../src/app/confirmacion.tsx), `ConfirmationScreen` | Referencia, estado y detalles de la reserva; regreso al inicio y acceso a carta. | Si no están disponibles los detalles en memoria, presenta la referencia y explica que recargar o abrir el enlace en otro dispositivo no recupera el comprobante completo ni cancela la reserva. |
| Carta `/carta` | [carta.tsx](../src/app/carta.tsx), `MenuScreen` | Filtros Todo/Pizzas/Entradas/Postres/Bebidas, secciones, ilustraciones, nombre, descripción y precio en COP. | Carga, error, carta vacía o categoría sin productos visibles. Incluye aviso de precios de referencia de Rappi que pueden variar en el punto de venta. |

El resumen y los pasos compartidos del flujo están en [src/components/client/booking.tsx](../src/components/client/booking.tsx). La consulta de disponibilidad y sus estados proceden de [src/hooks/use-availability.ts](../src/hooks/use-availability.ts).

## Inventario de pantallas administrativas

| Pantalla o vista y ruta | Archivo y componente | Elementos principales | Estados y observaciones |
| --- | --- | --- | --- |
| Acceso `/admin`, sin autorización | [admin/index.tsx](../src/app/admin/index.tsx), `AdminScreen` | Bloque de marca, correo, contraseña oculta y botón de ingreso. | Campos incompletos, ingreso pendiente y mensajes de error. Una sesión sin permiso muestra una vista de acceso denegado y permite cerrar sesión para usar otra cuenta. No hay PIN de demostración. |
| Panel `/admin`, con autorización | [admin/index.tsx](../src/app/admin/index.tsx), `AdminScreen` | Tarjetas Mesas, Horarios, Reservas y Carta; conteos y cierre de sesión. | Comparte la ruta con acceso: el contenido depende de la sesión y los permisos. El conteo de reservas corresponde a las confirmadas de hoy. |
| Mesas `/admin/mesas` | [admin/mesas.tsx](../src/app/admin/mesas.tsx), `AdminTablesScreen` | Listado de mesas, capacidad y zona, cambio Disponible/Inactiva y acceso a Nueva mesa. | Acción pendiente, éxito y error. Cambiar el estado no cancela reservas existentes. No representa un plano físico interactivo del restaurante. |
| Nueva mesa `/admin/nueva-mesa` | [admin/nueva-mesa.tsx](../src/app/admin/nueva-mesa.tsx), `NewTableScreen` | Nombre, zona, opciones rápidas de zona, capacidad, estado inicial y acciones Guardar/Cancelar. | Validación y guardado pendiente; los campos se deshabilitan durante la operación. |
| Horarios `/admin/horarios` | [admin/horarios.tsx](../src/app/admin/horarios.tsx), `AdminShiftsScreen`; [shift-editor.tsx](../src/components/admin/shift-editor.tsx), `ShiftEditor` | Jornadas por día; nombre, apertura/cierre, duración, estado activa/pausada y alta de jornada. | Lista vacía, edición, alta, validación, guardado y error. Las horas se presentan como horarios de Colombia. |
| Reservas `/admin/reservas` | [admin/reservas.tsx](../src/app/admin/reservas.tsx), `AdminReservationsScreen` | Filtros por fecha, mesa y estado, datos de reserva, completar y cancelar. | Sin resultados, fecha inválida, actualización pendiente, éxito/error y confirmación explícita antes de cancelar. |
| Carta administrativa `/admin/carta` | [admin/carta.tsx](../src/app/admin/carta.tsx), `AdminMenuScreen` | Lista por categoría, productos visibles/ocultos, agregar, editar y cambiar visibilidad. | Categoría vacía, cambio pendiente, éxito y error. Ocultar conserva el registro; no es eliminación del plato. |
| Alta y edición `/admin/plato` | [admin/plato.tsx](../src/app/admin/plato.tsx), `DishScreen` y `DishForm` | Nombre, descripción, categoría, precio COP, visibilidad, guardar y cancelar. | Sin parámetro `id` crea; con `id` edita. Incluye carga inicial, registro no encontrado y validación. Con el plato ya cargado, una actualización conserva el tipo y clave del formulario. |

Las vistas de acceso y panel comparten archivo y ruta. Las variantes nuevo/editar plato también comparten pantalla; se documentan como variantes de uso, no como archivos adicionales.

## Adaptación, accesibilidad y recursos gráficos

- El contenido de `Screen` tiene ancho máximo de 1200 y márgenes adaptables. La carta usa tarjetas de una, dos o tres columnas según el ancho; Inicio también adapta su cabecera y tarjetas. Los formularios limitan su ancho para mantener legibilidad.
- [use-layout-width.ts](../src/hooks/use-layout-width.ts), `useLayoutWidth`, ofrece el mismo valor inicial de ancho al servidor y al cliente durante la hidratación. La prueba automatizada de HTML inicial no sustituye la comprobación en un navegador real.
- El contenedor común utiliza áreas seguras y `KeyboardAvoidingView`; los formularios especifican teclados adecuados para correo, teléfono o números. Sigue pendiente revisar foco, teclado y conservación visual del formulario al renovar sesión en dispositivos reales.
- Botones, filtros y campos incluyen etiquetas y estados de accesibilidad. Los campos muestran errores textuales; existen estilos de foco y áreas mínimas de interacción en los componentes compartidos. No se declara certificación WCAG ni prueba de lector de pantalla o contraste realizada.
- [icon.tsx](../src/components/konys/icon.tsx) y [product-art.tsx](../src/components/konys/product-art.tsx) implementan recursos locales. `ProductArt` presenta ilustraciones SVG, con etiqueta «ILUSTRACIÓN» en las tarjetas; no son fotografías reales de los platos.
- [product-media.ts](../src/constants/product-media.ts) contiene un mapa vacío para futuras fotografías autorizadas. La referencia a Rappi corresponde al aviso de precios de la carta; no acredita precios actuales ni uso de fotografías de esa plataforma.

## Espacios para mockups y evidencias reales

El equipo debe completar la siguiente tabla con un enlace al frame concreto de Figma y una captura tomada de la aplicación. Los textos **PENDIENTE** son espacios de documentación, no enlaces a archivos existentes. Registrar junto a cada evidencia fecha, dispositivo/plataforma, tamaño de pantalla y versión o commit. Usar datos de prueba y ocultar información personal o credenciales.

| Pantalla o variante | Frame de Figma | Captura real de la aplicación |
| --- | --- | --- |
| Inicio y tarjetas de mesas | PENDIENTE | PENDIENTE |
| Selección de fecha, jornada y horario | PENDIENTE | PENDIENTE |
| Formulario del cliente y validación de capacidad | PENDIENTE | PENDIENTE |
| Confirmación de reserva | PENDIENTE | PENDIENTE |
| Carta digital y aviso de precios | PENDIENTE | PENDIENTE |
| Acceso administrativo y error de acceso | PENDIENTE | PENDIENTE |
| Panel administrativo | PENDIENTE | PENDIENTE |
| Gestión de mesas | PENDIENTE | PENDIENTE |
| Nueva mesa | PENDIENTE | PENDIENTE |
| Jornadas y horarios | PENDIENTE | PENDIENTE |
| Reservas y filtros | PENDIENTE | PENDIENTE |
| Carta administrativa | PENDIENTE | PENDIENTE |
| Nuevo plato | PENDIENTE | PENDIENTE |
| Editar plato | PENDIENTE | PENDIENTE |

Antes de considerar completa la evidencia visual, comparar cada vista con su mockup y registrar diferencias aceptadas por el equipo. Revisar en iPhone y web navegación, textos largos, teclado, estados vacíos, errores y renovación de sesión. Consultar [PRUEBAS.md](PRUEBAS.md) para las comprobaciones pendientes y [GUION_VIDEO.md](GUION_VIDEO.md) para presentar únicamente resultados observados durante la grabación.
