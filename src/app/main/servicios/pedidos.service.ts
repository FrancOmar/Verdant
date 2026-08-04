import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getDatabase, ref, set, onValue } from 'firebase/database';

export interface PedidoItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

export interface Pedido {
  id: number;
  dateStr: string; // Formato YYYY-MM-DD
  timeStr: string; // Formato HH:MM
  items: PedidoItem[];
  subtotal: number;
  tax: number;
  total: number;
  clientName?: string;
  clientPhone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private STORAGE_KEY = 'verdant_pedidos_history';
  private pedidosSubject: BehaviorSubject<Pedido[]> = new BehaviorSubject<Pedido[]>([]);

  constructor() {
    this.syncWithFirebase();
  }

  // Se suscribe al nodo 'pedidos' en Firebase en tiempo real
  private syncWithFirebase(): void {
    try {
      const db = getDatabase();
      const pedidosRef = ref(db, 'pedidos');
      
      onValue(pedidosRef, (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
          this.pedidosSubject.next(data);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } else {
          this.pedidosSubject.next([]);
        }
      }, (error) => {
        console.error("Error al leer pedidos desde Firebase, cargando desde cache local:", error);
        this.loadFromLocalStorageFallback();
      });
    } catch (e) {
      console.error("Excepción al conectar pedidos con Firebase:", e);
      this.loadFromLocalStorageFallback();
    }
  }

  private loadFromLocalStorageFallback(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      this.pedidosSubject.next(JSON.parse(data));
    } else {
      this.pedidosSubject.next([]);
    }
  }

  public getPedidos(): Pedido[] {
    return this.pedidosSubject.getValue();
  }

  public getPedidos$(): Observable<Pedido[]> {
    return this.pedidosSubject.asObservable();
  }

  public savePedidos(pedidos: Pedido[]): void {
    try {
      const db = getDatabase();
      const pedidosRef = ref(db, 'pedidos');
      set(pedidosRef, pedidos)
        .then(() => {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pedidos));
        })
        .catch(err => {
          console.error("Error al guardar pedidos en Firebase:", err);
          this.pedidosSubject.next(pedidos);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pedidos));
        });
    } catch (e) {
      console.error("Excepción al guardar pedidos en Firebase:", e);
      this.pedidosSubject.next(pedidos);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pedidos));
    }
  }

  public addPedido(items: PedidoItem[], subtotal: number, tax: number, total: number, clientName?: string, clientPhone?: string): void {
    const list = [...this.getPedidos()];
    const now = new Date();
    
    // Formatear fecha local YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Formatear hora local HH:MM
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const newPedido: Pedido = {
      id: list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1,
      dateStr,
      timeStr,
      items,
      subtotal,
      tax,
      total,
      clientName,
      clientPhone
    };

    list.unshift(newPedido);
    this.savePedidos(list);
  }

  public deletePedido(id: number): void {
    let list = this.getPedidos().filter(p => p.id !== id);
    this.savePedidos(list);
  }

  public clearAll(): void {
    this.savePedidos([]);
  }

  // Obtener estadísticas de consumo para un día específico
  public getStatsForDate(dateStr?: string): { count: number; total: number; itemsCount: number } {
    if (!dateStr) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }
    const list = this.getPedidos();
    const dayList = list.filter(p => p.dateStr === dateStr);

    const count = dayList.length;
    const total = dayList.reduce((acc, p) => acc + p.total, 0);
    const itemsCount = dayList.reduce((acc, p) => acc + p.items.reduce((accI, item) => accI + item.quantity, 0), 0);

    return { count, total, itemsCount };
  }
}
