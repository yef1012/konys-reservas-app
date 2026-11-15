# KONYS PIZZA

## Aplicación móvil para la reserva de mesas

**Universidad:** Corporación Universitaria de Ciencia y Desarrollo – UNICIENCIA
**Programa:** Ingeniería de Sistemas
**Asignatura:** Programación Móvil
**Docente:** Carlos Carrascal

**Integrantes:**

- Yefry Fernando Amaya Barbosa
- Andrés David Pérez Pardo

**Fecha:** Noviembre de 2026

---

## 1. Descripción del proyecto

KONYS PIZZA es una aplicación móvil desarrollada para facilitar la reserva de mesas en una pizzería y mejorar la gestión administrativa del establecimiento.

La aplicación permite a los clientes consultar mesas disponibles para reservar, seleccionar una fecha y horario, registrar sus datos y confirmar una reserva.

También incluye una carta digital y un panel administrativo protegido mediante autenticación.

## 2. Objetivo general

Desarrollar una aplicación móvil utilizando React Native, Expo y Supabase, que permita gestionar las reservas de mesas de KONYS PIZZA y optimizar la administración de mesas, horarios, reservas y productos.

## 3. Funcionalidades

### Módulo del cliente

- Consultar mesas activas, zonas y capacidades.
- Seleccionar mesa, fecha y horario de reserva.
- Consultar franjas horarias disponibles.
- Registrar nombre, número de personas y contacto opcional.
- Validar la capacidad de las mesas.
- Prevenir reservas duplicadas mediante validaciones del sistema.
- Visualizar la confirmación de la reserva.
- Consultar la carta digital por categorías.

### Módulo administrativo

- Iniciar sesión con credenciales autorizadas.
- Registrar mesas y modificar su estado activo o inactivo.
- Configurar horarios de atención.
- Consultar y filtrar reservas.
- Cancelar o finalizar reservas.
- Agregar, modificar y ocultar productos de la carta digital.

## 4. Tecnologías utilizadas

| Tecnología    | Uso                          |
| ------------- | ---------------------------- |
| React Native  | Desarrollo móvil             |
| Expo SDK 58   | Entorno de desarrollo        |
| Expo Router   | Navegación                   |
| TypeScript    | Desarrollo tipado            |
| Supabase      | Servicios de backend         |
| PostgreSQL    | Base de datos                |
| Supabase Auth | Autenticación administrativa |
| Git y GitHub  | Control de versiones         |

## 5. Instalación

Clonar el repositorio:

`git clone https://github.com/yef1012/konys-reservas-app.git`

Entrar a la carpeta:

`cd konys-reservas-app`

Instalar las dependencias:

`npm ci`

Crear el archivo `.env.local` utilizando los nombres de variables definidos en `.env.example`.

Configurar:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Iniciar la aplicación:

`npx expo start -c`

Para realizar pruebas, utilizar Expo Go en un dispositivo compatible.

**Nota:** la aplicación requiere un proyecto Supabase configurado con las tablas, funciones SQL y políticas de seguridad correspondientes. Las variables de entorno por sí solas no crean estos recursos.

## 6. Base de datos

La información del sistema se almacena en Supabase PostgreSQL mediante cuatro tablas principales:

- **mesas:** nombre, zona, capacidad y estado.
- **horarios:** días, jornadas y duración de las reservas.
- **reservas:** datos del cliente, mesa, fecha, horario y estado.
- **platos:** productos, categorías, descripción, precio y disponibilidad.

El sistema utiliza funciones RPC para gestionar la creación de reservas y consultar la ocupación de horarios.

## 7. Seguridad

La autenticación administrativa utiliza Supabase Auth.

Los permisos de acceso se controlan mediante políticas de seguridad a nivel de filas (RLS) configuradas en la base de datos.

No deben publicarse contraseñas ni claves privadas. Las variables con prefijo `EXPO_PUBLIC_` son públicas y no deben contener secretos.

## 8. Estructura del proyecto

- `src/app/`: pantallas y rutas.
- `src/components/`: componentes reutilizables.
- `src/services/`: servicios y consultas.
- `src/state/`: estado de la aplicación.
- `src/hooks/`: hooks.
- `src/utils/`: funciones auxiliares.
- `src/types/`: tipos de datos.
- `supabase/`: scripts SQL incluidos en el repositorio.
- `tests/`: pruebas automatizadas.
- `docs/`: documentación académica y evidencias.

## 9. Pruebas

La aplicación ha sido probada manualmente en un iPhone mediante Expo Go.

Se ha verificado el flujo básico de creación de reservas y su visualización posterior en el módulo administrativo.

El proyecto también dispone de pruebas automatizadas. Algunas verificaciones adicionales de seguridad, concurrencia y compatibilidad Android siguen pendientes de documentación.

## 10. Alcance del proyecto

La aplicación contempla reservas de mesas, carta digital y gestión administrativa.

No incluye pagos en línea, pedidos a domicilio, notificaciones push ni publicación en tiendas de aplicaciones.

## 11. Repositorio

**GitHub:** https://github.com/yef1012/konys-reservas-app

**Proyecto académico — UNICIENCIA, noviembre de 2026.**
