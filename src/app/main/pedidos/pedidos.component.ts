import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PedidosService, Pedido } from '../servicios/pedidos.service';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss']
})
export class PedidosComponent implements OnInit, OnDestroy {
  public contentHeader: object;
  public selectedDate: string = '';
  public allPedidos: Pedido[] = [];

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private _pedidosService: PedidosService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.contentHeader = {
      headerTitle: 'Pedidos y Consumo',
      actionButton: false,
      breadcrumb: {
        type: '',
        links: [
          {
            name: 'Inicio',
            isLink: true,
            link: '/'
          },
          {
            name: 'Pedidos',
            isLink: false
          }
        ]
      }
    };

    // Inicializar el filtro de fecha por defecto a "Hoy"
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.selectedDate = `${year}-${month}-${day}`;

    // Subscribirse al historial de pedidos en tiempo real
    this._pedidosService.getPedidos$()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(pedidos => {
        this.allPedidos = pedidos;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  // Helper to get local date string YYYY-MM-DD
  private getLocalDateStr(offsetDays: number = 0): string {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get orders filtered by chosen date picker value
  get filteredPedidos(): Pedido[] {
    const all = this.allPedidos;
    if (!this.selectedDate) return all;
    return all.filter(p => p.dateStr === this.selectedDate);
  }

  // Compute statistics on the currently filtered list
  get stats(): { count: number; total: number; itemsCount: number } {
    const list = this.filteredPedidos;
    const count = list.length;
    const total = list.reduce((acc, p) => acc + p.total, 0);
    const itemsCount = list.reduce((acc, p) => acc + p.items.reduce((accI, item) => accI + item.quantity, 0), 0);

    return { count, total, itemsCount };
  }

  public deletePedido(id: number): void {
    this._pedidosService.deletePedido(id);
    this.toastr.error('Pedido eliminado del registro de consumo.', 'Pedidos', {
      toastClass: 'toast ngx-toastr',
      closeButton: true,
      timeOut: 2000
    });
  }

  public clearHistory(): void {
    if (confirm('¿Está seguro de que desea vaciar todo el historial de pedidos y consumo?')) {
      this._pedidosService.clearAll();
      this.toastr.error('Todo el historial de consumo ha sido borrado.', 'Pedidos', {
        toastClass: 'toast ngx-toastr',
        closeButton: true,
        timeOut: 3000
      });
    }
  }

  // Friendly date display
  public formatFriendlyDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parts[2];
    const month = parts[1];
    const year = parts[0];

    const todayStr = this.getLocalDateStr(0);
    const yesterdayStr = this.getLocalDateStr(-1);

    if (dateStr === todayStr) {
      return 'Hoy';
    } else if (dateStr === yesterdayStr) {
      return 'Ayer';
    }
    
    return `${day}/${month}/${year}`;
  }
}
