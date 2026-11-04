// Contrato de las tablas existentes. No añade columnas ni modifica el esquema.
import type { OccupiedInterval } from './restaurant';

export type MesaRow = { id: string; nombre: string; zona: string; capacidad: number; activa: boolean; foto_url: string | null; creado_en: string };
export type HorarioRow = { id: string; dia_semana: number; jornada: string; hora_inicio: string; hora_fin: string; duracion_slot: number; activo: boolean };
export type PlatoRow = { id: string; nombre: string; categoria: string; descripcion: string | null; precio: number; disponible: boolean };
export type ReservaRow = { id: string; mesa_id: string; cliente_nombre: string; cliente_contacto: string | null; num_personas: number; fecha: string; hora_inicio: string; hora_fin: string; estado: string; creado_en: string };
type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };
export type Database = {
  public: {
    Tables: {
      mesas: Table<MesaRow, Omit<MesaRow, 'id' | 'creado_en' | 'foto_url'> & { foto_url?: string | null }>;
      horarios: Table<HorarioRow, Omit<HorarioRow, 'id'>>;
      platos: Table<PlatoRow, Omit<PlatoRow, 'id'>>;
      reservas: { Row: ReservaRow; Insert: never; Update: { estado?: string }; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      consultar_ocupacion: { Args: { p_mesa_id: string; p_fecha: string }; Returns: OccupiedInterval[] };
      crear_reserva: { Args: { p_mesa_id: string; p_cliente_nombre: string; p_num_personas: number; p_fecha: string; p_hora_inicio: string; p_cliente_contacto: string | null }; Returns: string };
      verificar_acceso_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
