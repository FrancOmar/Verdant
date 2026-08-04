import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getDatabase, ref, set, onValue } from 'firebase/database';

export interface InventarioItem {
  id: number;
  name: string;
  sku: string;
  category: string; // 'Refrescos', 'Licores y Alcohol', 'Natural / Energizante'
  stock: number;
  price: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private readonly storageKey = 'verdant_inventario';
  private itemsSubject: BehaviorSubject<InventarioItem[]> = new BehaviorSubject<InventarioItem[]>([]);

  private defaultDrinks: InventarioItem[] = [
    {
      id: 1,
      name: 'Coca-Cola',
      sku: 'BEB-COCA',
      category: 'Refrescos',
      stock: 50,
      price: 7.00,
      status: 'IN_STOCK'
    },
    {
      id: 2,
      name: 'Fanta Naranja',
      sku: 'BEB-FANT',
      category: 'Refrescos',
      stock: 35,
      price: 7.00,
      status: 'IN_STOCK'
    },
    {
      id: 3,
      name: 'Sprite',
      sku: 'BEB-SPRI',
      category: 'Refrescos',
      stock: 40,
      price: 7.00,
      status: 'IN_STOCK'
    },
    {
      id: 4,
      name: 'Ron Abuelo Añejo',
      sku: 'BEB-ABUE',
      category: 'Licores y Alcohol',
      stock: 20,
      price: 150.00,
      status: 'IN_STOCK'
    },
    {
      id: 5,
      name: 'Whisky Johnnie Walker Black',
      sku: 'BEB-JONN',
      category: 'Licores y Alcohol',
      stock: 12,
      price: 320.00,
      status: 'IN_STOCK'
    },
    {
      id: 6,
      name: 'Fernet Branca',
      sku: 'BEB-FERN',
      category: 'Licores y Alcohol',
      stock: 18,
      price: 120.00,
      status: 'IN_STOCK'
    },
    {
      id: 7,
      name: 'Cerveza Corona Extra',
      sku: 'BEB-CORO',
      category: 'Licores y Alcohol',
      stock: 80,
      price: 15.00,
      status: 'IN_STOCK'
    },
    {
      id: 8,
      name: 'Gin Tanqueray London Dry',
      sku: 'BEB-GIN',
      category: 'Licores y Alcohol',
      stock: 8,
      price: 220.00,
      status: 'IN_STOCK'
    },
    {
      id: 9,
      name: 'Jugo de Naranja Natural',
      sku: 'BEB-JUGO',
      category: 'Natural / Energizante',
      stock: 25,
      price: 12.00,
      status: 'IN_STOCK'
    },
    {
      id: 10,
      name: 'Agua Mineral Evian',
      sku: 'BEB-AGUA',
      category: 'Natural / Energizante',
      stock: 30,
      price: 5.00,
      status: 'IN_STOCK'
    },
    {
      id: 11,
      name: 'Red Bull Energy Drink',
      sku: 'BEB-RED',
      category: 'Natural / Energizante',
      stock: 45,
      price: 18.00,
      status: 'IN_STOCK'
    },
    {
      id: 12,
      name: 'Pisco Capel Reservado',
      sku: 'BEB-PISC',
      category: 'Licores y Alcohol',
      stock: 0,
      price: 90.00,
      status: 'OUT_OF_STOCK'
    }
  ];

  constructor() {
    this.syncWithFirebase();
  }

  // Se suscribe al nodo 'inventario' en Firebase en tiempo real
  private syncWithFirebase(): void {
    try {
      const db = getDatabase();
      const inventarioRef = ref(db, 'inventario');
      
      onValue(inventarioRef, (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
          this.itemsSubject.next(data);
          localStorage.setItem(this.storageKey, JSON.stringify(data));
        } else {
          // Si no hay datos en Firebase, inicializar con las bebidas de muestra
          this.saveToFirebase(this.defaultDrinks);
        }
      }, (error) => {
        console.error("Error al leer desde Firebase, cargando desde local storage:", error);
        this.loadFromLocalStorageFallback();
      });
    } catch (e) {
      console.error("Excepción al conectar con Firebase:", e);
      this.loadFromLocalStorageFallback();
    }
  }

  private loadFromLocalStorageFallback(): void {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      this.itemsSubject.next(JSON.parse(data));
    } else {
      this.itemsSubject.next(this.defaultDrinks);
    }
  }

  private saveToFirebase(items: InventarioItem[]): void {
    try {
      const db = getDatabase();
      const inventarioRef = ref(db, 'inventario');
      set(inventarioRef, items)
        .then(() => {
          localStorage.setItem(this.storageKey, JSON.stringify(items));
        })
        .catch(err => {
          console.error("Error al escribir en Firebase:", err);
          // Fallback a LocalStorage si falla la red
          this.itemsSubject.next(items);
          localStorage.setItem(this.storageKey, JSON.stringify(items));
        });
    } catch (e) {
      console.error("Excepción al escribir en Firebase:", e);
      this.itemsSubject.next(items);
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    }
  }

  public getItems(): InventarioItem[] {
    return this.itemsSubject.getValue();
  }

  public getItems$(): Observable<InventarioItem[]> {
    return this.itemsSubject.asObservable();
  }

  public addItem(name: string, sku: string, category: string, stock: number, price: number): void {
    const items = [...this.getItems()];
    const id = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    
    let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
    if (stock === 0) {
      status = 'OUT_OF_STOCK';
    } else if (stock <= 5) {
      status = 'LOW_STOCK';
    }

    const newItem: InventarioItem = {
      id,
      name,
      sku: sku.toUpperCase(),
      category,
      stock,
      price,
      status
    };

    items.push(newItem);
    this.saveToFirebase(items);
  }

  public updateItem(id: number, name: string, sku: string, category: string, stock: number, price: number): void {
    const items = [...this.getItems()];
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (stock === 0) {
        status = 'OUT_OF_STOCK';
      } else if (stock <= 5) {
        status = 'LOW_STOCK';
      }

      items[index] = {
        id,
        name,
        sku: sku.toUpperCase(),
        category,
        stock,
        price,
        status
      };
      this.saveToFirebase(items);
    }
  }

  public deleteItem(id: number): void {
    const items = this.getItems().filter(i => i.id !== id);
    this.saveToFirebase(items);
  }

  public decreaseStock(id: number, quantity: number): void {
    const items = [...this.getItems()];
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      const current = items[index];
      const newStock = Math.max(0, current.stock - quantity);
      
      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (newStock === 0) {
        status = 'OUT_OF_STOCK';
      } else if (newStock <= 5) {
        status = 'LOW_STOCK';
      }

      items[index] = {
        ...current,
        stock: newStock,
        status
      };
      this.saveToFirebase(items);
    }
  }
}
