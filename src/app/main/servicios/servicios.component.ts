import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PedidosService, PedidoItem } from './pedidos.service';
import { InventarioService } from '../inventario/inventario.service';

export interface DrinkItem {
  id: number;
  name: string;
  category: 'SOFT_DRINKS' | 'ALCOHOL' | 'ENERGY';
  categoryLabel: string;
  price: number;
  description: string;
  rating: number;
  alcoholVol?: number;
  inStock: boolean;
  quantity: number;
}

@Component({
  selector: 'app-servicios',
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.scss']
})
export class ServiciosComponent implements OnInit {
  public contentHeader: object;
  public searchText: string = '';
  public selectedCategory: string = 'ALL';

  // Datos del Cliente
  public clientName: string = '';
  public clientPhone: string = '';
  public currentTicket: any = null;
  public lastTicketDataUrl: string = '';

  public drinks: DrinkItem[] = [];

  constructor(
    private toastr: ToastrService,
    private modalService: NgbModal,
    private _pedidosService: PedidosService,
    private _inventarioService: InventarioService
  ) {}

  ngOnInit(): void {
    this.contentHeader = {
      headerTitle: 'Servicios',
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
            name: 'Servicios',
            isLink: false
          }
        ]
      }
    };

    // Subscribirse a cambios en el inventario para actualizar el catálogo
    this._inventarioService.getItems$().subscribe(() => {
      this.loadDrinksFromInventory();
    });
  }

  // Carga las bebidas dinámicamente desde el servicio de inventario
  private loadDrinksFromInventory(): void {
    const inventoryItems = this._inventarioService.getItems();

    // Conservar las selecciones de carrito activas de la sesión del usuario
    const selectedMap = new Map<number, number>();
    this.drinks.forEach(d => {
      if (d.quantity > 0) {
        selectedMap.set(d.id, d.quantity);
      }
    });

    this.drinks = inventoryItems.map(item => {
      let categoryKey: 'SOFT_DRINKS' | 'ALCOHOL' | 'ENERGY' = 'SOFT_DRINKS';
      if (item.category === 'Licores y Alcohol') {
        categoryKey = 'ALCOHOL';
      } else if (item.category === 'Natural / Energizante') {
        categoryKey = 'ENERGY';
      }

      const previouslySelected = selectedMap.get(item.id) || 0;
      // Asegurar que la cantidad seleccionada no supere el stock de inventario actual
      const finalQty = Math.min(previouslySelected, item.stock);

      return {
        id: item.id,
        name: item.name,
        category: categoryKey,
        categoryLabel: item.category,
        price: item.price,
        description: '',
        rating: 4.8,
        inStock: item.stock > 0,
        quantity: finalQty
      };
    });
  }

  // Filter drinks based on category and search text
  get filteredDrinks(): DrinkItem[] {
    return this.drinks.filter(drink => {
      const matchesCategory = this.selectedCategory === 'ALL' || drink.category === this.selectedCategory;
      const matchesSearch = drink.name.toLowerCase().includes(this.searchText.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  // Get only selected drinks
  get selectedDrinks(): DrinkItem[] {
    return this.drinks.filter(drink => drink.quantity > 0);
  }

  // Selection calculations
  get subtotal(): number {
    return this.selectedDrinks.reduce((acc, drink) => acc + (drink.price * drink.quantity), 0);
  }

  get tax(): number {
    return this.subtotal * 0.10;
  }

  get total(): number {
    return this.subtotal + this.tax;
  }

  // Add/remove quantity
  public addToSelection(drink: DrinkItem): void {
    const invItem = this._inventarioService.getItems().find(i => i.id === drink.id);
    if (!invItem || invItem.stock <= 0) {
      this.toastr.warning('Este producto no cuenta con stock disponible en el inventario.', 'Sin Stock');
      return;
    }
    
    drink.quantity = 1;
    this.toastr.success(`"${drink.name}" se agregó a su selección.`, 'Servicios', {
      toastClass: 'toast ngx-toastr',
      closeButton: true,
      progressBar: true,
      timeOut: 2000
    });
  }

  public incrementQuantity(drink: DrinkItem): void {
    const invItem = this._inventarioService.getItems().find(i => i.id === drink.id);
    if (!invItem) return;
    
    if (drink.quantity >= invItem.stock) {
      this.toastr.warning(`No puedes seleccionar más de ${invItem.stock} unidades (límite de inventario).`, 'Límite de Stock');
      return;
    }
    
    drink.quantity++;
  }

  public decrementQuantity(drink: DrinkItem): void {
    if (drink.quantity > 0) {
      drink.quantity--;
      if (drink.quantity === 0) {
        this.toastr.info(`"${drink.name}" se removió de su selección.`, 'Servicios', {
          toastClass: 'toast ngx-toastr',
          closeButton: true,
          progressBar: true,
          timeOut: 2000
        });
      }
    }
  }

  public clearSelection(): void {
    this.drinks.forEach(drink => drink.quantity = 0);
    this.clientName = '';
    this.clientPhone = '';
    this.toastr.warning('Selección vaciada correctamente.', 'Servicios', {
      toastClass: 'toast ngx-toastr',
      closeButton: true,
      timeOut: 2500
    });
  }

  // Abre el modal para visualizar el ticket de consumo
  public confirmOrder(modalContentRef: any): void {
    if (this.selectedDrinks.length === 0) {
      this.toastr.warning('Por favor seleccione al menos un producto.', 'Servicios');
      return;
    }

    if (!this.clientName.trim()) {
      this.toastr.warning('Por favor ingrese el nombre del cliente.', 'Servicios');
      return;
    }

    if (!this.clientPhone.trim()) {
      this.toastr.warning('Por favor ingrese el número de celular del cliente.', 'Servicios');
      return;
    }

    // Estructurar fecha y hora local del ticket
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${day}/${month}/${year}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    this.currentTicket = {
      clientName: this.clientName,
      clientPhone: this.clientPhone,
      dateStr: dateStr,
      timeStr: timeStr,
      items: this.selectedDrinks.map(d => ({
        name: d.name,
        quantity: d.quantity,
        price: d.price,
        total: d.price * d.quantity
      })),
      subtotal: this.subtotal,
      tax: this.tax,
      total: this.total
    };

    // Abrir el modal con NgbModal
    this.modalService.open(modalContentRef, {
      centered: true,
      windowClass: 'modal-slide-in',
      size: 'sm'
    });
  }

  // Dibuja el ticket estilo Playboy en un canvas HTML5 y lo copia al portapapeles como imagen
  public drawTicketToCanvasAndCopy(): Promise<boolean> {
    const canvas = document.createElement('canvas');
    canvas.width = 420;

    const items = this.currentTicket.items;
    const headerHeight = 220;
    const itemHeight = 35;
    const footerHeight = 220;
    canvas.height = headerHeight + (items.length * itemHeight) + footerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(false);

    // 1. Fondo Oscuro Lujoso (Playboy Dark Theme)
    ctx.fillStyle = '#0f0f12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borde Rosa Neón Brillante
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 5;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Borde Dorado Fino
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // 2. Cabecera (Playboy Style)
    ctx.textAlign = 'center';
    
    // Insignia VIP
    ctx.fillStyle = '#ff007f';
    ctx.font = '900 11px Arial';
    ctx.fillText('V I P   L O U N G E', canvas.width / 2, 40);

    // Título Principal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText('VERDANT', canvas.width / 2, 80);

    // Subtítulo
    ctx.fillStyle = '#d4af37';
    ctx.font = 'italic 12px Arial';
    ctx.fillText('•   E X C L U S I V E   C L U B   •', canvas.width / 2, 105);

    // Separador
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, 125);
    ctx.lineTo(canvas.width - 35, 125);
    ctx.stroke();

    // 3. Detalles de Cliente y Fecha
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial';
    
    ctx.fillStyle = '#888888';
    ctx.fillText('CLIENTE:', 35, 150);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(this.currentTicket.clientName.toUpperCase(), 110, 150);

    ctx.fillStyle = '#888888';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('CELULAR:', 35, 172);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.currentTicket.clientPhone, 110, 172);

    ctx.fillStyle = '#888888';
    ctx.fillText('FECHA:', 35, 194);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.currentTicket.dateStr}  ${this.currentTicket.timeStr}`, 110, 194);

    // Separador
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(35, 210);
    ctx.lineTo(canvas.width - 35, 210);
    ctx.stroke();

    // 4. Detalle de Consumo
    let currentY = 240;
    ctx.font = '13px Arial';

    // Cabecera de detalle
    ctx.fillStyle = '#ff007f';
    ctx.font = '900 11px Arial';
    ctx.fillText('DETALLE DE CONSUMO', 35, currentY);
    currentY += 25;

    items.forEach((item: any) => {
      // Cantidad y Nombre
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial';
      ctx.fillText(`${item.quantity}x  ${item.name}`, 35, currentY);

      // Total Item (Derecha)
      ctx.textAlign = 'right';
      ctx.fillStyle = '#d4af37';
      ctx.fillText(`Bs. ${item.total.toFixed(2)}`, canvas.width - 35, currentY);

      currentY += 32;
    });

    // Separador
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, currentY - 10);
    ctx.lineTo(canvas.width - 35, currentY - 10);
    ctx.stroke();

    currentY += 15;

    // 5. Cálculos y Totales
    ctx.font = '12px Arial';
    ctx.fillStyle = '#888888';

    // Subtotal
    ctx.textAlign = 'left';
    ctx.fillText('SUBTOTAL:', 35, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(`Bs. ${this.currentTicket.subtotal.toFixed(2)}`, canvas.width - 35, currentY);
    
    currentY += 22;

    // Impuesto
    ctx.textAlign = 'left';
    ctx.fillText('IMPUESTO (10%):', 35, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(`Bs. ${this.currentTicket.tax.toFixed(2)}`, canvas.width - 35, currentY);

    currentY += 32;

    // Rectángulo del TOTAL
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(35, currentY - 15, canvas.width - 70, 42);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('TOTAL A PAGAR:', 48, currentY + 11);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff007f';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Bs. ${this.currentTicket.total.toFixed(2)}`, canvas.width - 48, currentY + 11);

    currentY += 60;

    // 6. Pie de Página
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888888';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillText('Gracias por ser parte de la exclusividad.', canvas.width / 2, currentY);

    // Guardar URL de la imagen para su descarga como JPG
    this.lastTicketDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Convertir a blob de imagen y copiar
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(() => {
            resolve(true);
          }).catch(err => {
            console.error('Error al copiar al portapapeles', err);
            resolve(false);
          });
        } catch (e) {
          console.error('Excepción al copiar imagen', e);
          resolve(false);
        }
      }, 'image/png');
    });
  }

  // Genera y copia la imagen del ticket, y redirige a WhatsApp
  public sendWhatsApp(): void {
    if (!this.currentTicket) return;

    const ticket = this.currentTicket;
    
    // Texto de fallback o presentación rápida en chat
    let quickText = `*VERDANT VIP CLUB*\n`;
    quickText += `¡Hola ${ticket.clientName}! Aquí tienes tu ticket de consumo VIP.\n\n`;
    quickText += `_Presiona Ctrl+V para pegar y enviar el ticket de consumo en imagen._`;

    const encodedText = encodeURIComponent(quickText);
    const cleanPhone = ticket.clientPhone.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

    // Copiar la imagen, descargar el archivo y luego redirigir a WhatsApp
    this.drawTicketToCanvasAndCopy().then(copied => {
      // 1. Forzar descarga de la imagen en el navegador
      if (this.lastTicketDataUrl) {
        const link = document.createElement('a');
        link.download = `ticket_${ticket.clientName.replace(/\s+/g, '_')}.jpg`;
        link.href = this.lastTicketDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      if (copied) {
        this.toastr.success('¡Imagen descargada y copiada al portapapeles! Presione Ctrl+V en WhatsApp o arrastre el archivo para enviarlo.', 'Ticket Generado', {
          timeOut: 6000
        });
      } else {
        this.toastr.warning('¡Ticket descargado! Arrastre el archivo descargado en WhatsApp para enviarlo.', 'Ticket Descargado', {
          timeOut: 6000
        });
      }

      // Abrir chat de WhatsApp
      window.open(url, '_blank');
    });
  }

  // Registra el pedido en el historial y resetea el formulario
  public finishOrder(modal: any): void {
    if (!this.currentTicket) return;

    // 1. Disminuir el stock en el inventario para cada item del pedido
    this.currentTicket.items.forEach((item: any) => {
      const drink = this.drinks.find(d => d.name === item.name);
      if (drink) {
        this._inventarioService.decreaseStock(drink.id, item.quantity);
      }
    });

    // 2. Mapear items para persistencia
    const itemsToOrder: PedidoItem[] = this.selectedDrinks.map(drink => ({
      id: drink.id,
      name: drink.name,
      quantity: drink.quantity,
      price: drink.price
    }));

    // 3. Registrar en el historial de consumo
    this._pedidosService.addPedido(
      itemsToOrder, 
      this.subtotal, 
      this.tax, 
      this.total, 
      this.clientName, 
      this.clientPhone
    );

    // Cerrar modal
    modal.close();

    // Feedback al usuario
    this.toastr.success('Se registró el consumo y se actualizó el stock del inventario.', '¡Pedido Guardado!');

    // Sincronizar catálogo con el inventario actualizado
    this.loadDrinksFromInventory();

    // Limpiar carrito y campos
    this.clientName = '';
    this.clientPhone = '';
    this.currentTicket = null;
  }

  // Desplazarse suavemente hasta la sección de facturación en móviles
  public scrollToSummary(): void {
    const el = document.getElementById('order-summary-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
