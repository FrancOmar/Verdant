import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InventarioService, InventarioItem } from '../inventario/inventario.service';
import { PedidosService, Pedido, PedidoItem } from '../servicios/pedidos.service';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit, OnDestroy {
  public contentHeader: object;
  
  // Métricas del Inventario
  public totalStockQty: number = 0;
  public totalStockValuation: number = 0;
  public outOfStockCount: number = 0;
  public lowStockCount: number = 0;

  // Bebidas más vendidas e Inventario Actual
  public popularDrinks: any[] = [];
  public inventoryItems: InventarioItem[] = [];

  // Configuración del Gráfico de Donut (ApexCharts)
  public chartOptions: any = {};
  public showChart: boolean = false;
  public totalSalesCount: number = 0;

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private _inventarioService: InventarioService,
    private _pedidosService: PedidosService
  ) {}

  ngOnInit(): void {
    this.contentHeader = {
      headerTitle: 'Informes y Reportes VIP',
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
            name: 'Reportes',
            isLink: false
          }
        ]
      }
    };

    // Combinar la carga en tiempo real de productos y pedidos
    combineLatest([
      this._inventarioService.getItems$(),
      this._pedidosService.getPedidos$()
    ])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(([items, pedidos]) => {
        this.inventoryItems = items;
        this.calculateMetrics(items, pedidos);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private calculateMetrics(items: InventarioItem[], pedidos: Pedido[]): void {
    // 1. Métricas de Stock Físico
    this.totalStockQty = items.reduce((acc, curr) => acc + curr.stock, 0);
    this.totalStockValuation = items.reduce((acc, curr) => acc + (curr.stock * curr.price), 0);
    this.outOfStockCount = items.filter(item => item.stock === 0).length;
    this.lowStockCount = items.filter(item => item.stock > 0 && item.stock <= 5).length;

    // 2. Acumular las ventas de bebidas (pedidos más requeridos)
    const popularityMap = new Map<string, { quantity: number; revenue: number }>();

    // Inicializar todos los productos del inventario actual con 0 ventas
    items.forEach(item => {
      popularityMap.set(item.name, { quantity: 0, revenue: 0 });
    });

    // Sumar ventas históricas
    pedidos.forEach(pedido => {
      pedido.items.forEach(item => {
        const existing = popularityMap.get(item.name) || { quantity: 0, revenue: 0 };
        popularityMap.set(item.name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.quantity * item.price)
        });
      });
    });

    // Convertir el mapa a un array y ordenar de mayor a menor ventas
    const salesArray = Array.from(popularityMap.entries()).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      revenue: data.revenue
    }));

    salesArray.sort((a, b) => b.quantity - a.quantity);
    this.totalSalesCount = salesArray.reduce((acc, curr) => acc + curr.quantity, 0);

    // Mapear con porcentajes de barra visuales relativos al producto más vendido
    const maxQty = salesArray[0]?.quantity || 1;
    this.popularDrinks = salesArray.map((drink, index) => ({
      rank: index + 1,
      name: drink.name,
      quantity: drink.quantity,
      revenue: drink.revenue,
      barPercentage: drink.quantity > 0 ? Math.round((drink.quantity / maxQty) * 100) : 0
    }));

    // 3. Configurar gráfico de Donut de ApexCharts con las 5 bebidas más vendidas (ventas > 0)
    const topSalesForChart = salesArray.filter(d => d.quantity > 0).slice(0, 5);

    if (topSalesForChart.length > 0) {
      this.showChart = true;
      this.chartOptions = {
        series: topSalesForChart.map(d => d.quantity),
        chart: {
          type: 'donut',
          height: 320,
          background: 'transparent',
          foreColor: '#b4b4db'
        },
        labels: topSalesForChart.map(d => d.name),
        colors: ['#ff007f', '#d4af37', '#00cfc9', '#ff9f43', '#7367f0'],
        stroke: {
          show: false
        },
        dataLabels: {
          enabled: true,
          style: {
            colors: ['#fff'],
            fontSize: '11px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold'
          },
          dropShadow: {
            enabled: false
          }
        },
        legend: {
          position: 'bottom',
          fontFamily: 'Montserrat, Georgia, serif',
          labels: {
            colors: '#b4b4db'
          }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show: true,
                name: {
                  show: true,
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'Montserrat, sans-serif'
                },
                value: {
                  show: true,
                  color: '#ff007f',
                  fontSize: '20px',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 'bold',
                  formatter: (val: any) => `${val} uds`
                },
                total: {
                  show: true,
                  label: 'Ventas Totales',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontFamily: 'Montserrat, sans-serif',
                  formatter: () => `${this.totalSalesCount} uds`
                }
              }
            }
          }
        }
      };
    } else {
      this.showChart = false;
    }
  }

  // Helper para determinar el color de barra según nivel de stock
  public getStockProgressClass(stock: number): string {
    if (stock === 0) return 'bg-danger';
    if (stock <= 5) return 'bg-warning';
    return 'bg-success';
  }
}
