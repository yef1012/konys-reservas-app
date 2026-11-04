import type { DemoData } from '../types/demo';
import { addDays, todayISO } from '../utils/reservations';

// Datos ficticios para la presentación universitaria. Se reinician al recargar.
export const DEMO_PIN = '1234';
export const categories = ['pizzas', 'entradas', 'postres', 'bebidas'] as const;
export const categoryLabels = { pizzas: 'Pizzas', entradas: 'Entradas', postres: 'Postres', bebidas: 'Bebidas' };

export function createDemoData(): DemoData {
  const today = todayISO();
  return {
    tables: [
      { id: 'mesa-1', name: 'Mesa 01', zone: 'Salón principal', capacity: 2, status: 'disponible' },
      { id: 'mesa-2', name: 'Mesa 02', zone: 'Salón principal', capacity: 4, status: 'disponible' },
      { id: 'mesa-3', name: 'Mesa 03', zone: 'Salón principal', capacity: 4, status: 'ocupada' },
      { id: 'mesa-4', name: 'Mesa 04', zone: 'Terraza', capacity: 6, status: 'disponible' },
      { id: 'mesa-5', name: 'Mesa 05', zone: 'Terraza', capacity: 2, status: 'reservada' },
      { id: 'mesa-6', name: 'Mesa 06', zone: 'Terraza', capacity: 4, status: 'disponible' },
      { id: 'mesa-7', name: 'Mesa 07', zone: 'Salón privado', capacity: 8, status: 'disponible' },
      { id: 'mesa-8', name: 'Mesa 08', zone: 'Salón privado', capacity: 6, status: 'mantenimiento' },
    ],
    shifts: [
      { id: 'almuerzo', name: 'Almuerzo', start: '12:00', end: '16:00', duration: 60, enabled: true },
      { id: 'cena', name: 'Cena', start: '18:00', end: '22:00', duration: 60, enabled: true },
    ],
    reservations: [
      { id: 'DEMO-001', tableId: 'mesa-2', date: today, time: '19:00', duration: 60, shiftId: 'cena', name: 'Valentina Demo', people: 3, contact: '', status: 'confirmada' },
      { id: 'DEMO-002', tableId: 'mesa-4', date: addDays(today, 1), time: '13:00', duration: 60, shiftId: 'almuerzo', name: 'Andrés Ejemplo', people: 5, contact: '', status: 'confirmada' },
      { id: 'DEMO-003', tableId: 'mesa-1', date: today, time: '12:00', duration: 60, shiftId: 'almuerzo', name: 'Camila Demo', people: 2, contact: '', status: 'completada' },
      { id: 'DEMO-004', tableId: 'mesa-6', date: addDays(today, 1), time: '20:00', duration: 60, shiftId: 'cena', name: 'Santiago Ejemplo', people: 4, contact: '', status: 'cancelada' },
    ],
    dishes: [
      { id: 'pizza-1', name: 'Margherita', description: 'Salsa de tomate, mozzarella y albahaca fresca.', category: 'pizzas', price: 28000, visible: true },
      { id: 'pizza-2', name: 'Pepperoni', description: 'Mozzarella fundida, pepperoni y nuestra salsa de la casa.', category: 'pizzas', price: 34000, visible: true },
      { id: 'pizza-3', name: 'Especial KONYS', description: 'Pollo, champiñones, tocineta y un toque de orégano.', category: 'pizzas', price: 39000, visible: true },
      { id: 'entrada-1', name: 'Pan de ajo', description: 'Pan horneado con mantequilla de ajo y queso gratinado.', category: 'entradas', price: 12000, visible: true },
      { id: 'entrada-2', name: 'Bruschettas', description: 'Tostadas con tomate fresco, albahaca y aceite de oliva.', category: 'entradas', price: 15000, visible: true },
      { id: 'postre-1', name: 'Brownie con helado', description: 'Brownie tibio de chocolate con helado de vainilla.', category: 'postres', price: 14000, visible: true },
      { id: 'postre-2', name: 'Tiramisú', description: 'Capas cremosas de mascarpone, café y cacao.', category: 'postres', price: 16000, visible: true },
      { id: 'bebida-1', name: 'Limonada natural', description: 'Limón recién exprimido. El complemento perfecto.', category: 'bebidas', price: 8000, visible: true },
      { id: 'bebida-2', name: 'Té de frutos rojos', description: 'Infusión fría de frutos rojos y hierbabuena.', category: 'bebidas', price: 9000, visible: true },
      { id: 'bebida-3', name: 'Soda de temporada', description: 'Producto de ejemplo oculto de la carta del cliente.', category: 'bebidas', price: 10000, visible: false },
    ],
  };
}
