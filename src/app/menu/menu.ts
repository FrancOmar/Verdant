import { CoreMenu } from '@core/types'

export const menu: CoreMenu[] = [
  {
    id: 'home',
    title: 'Home',
    translate: 'MENU.HOME',
    type: 'item',
    icon: 'home',
    url: 'home'
  },
  {
    id: 'inventario',
    title: 'Inventario',
    translate: 'MENU.INVENTARIO',
    type: 'item',
    icon: 'archive',
    url: 'inventario'
  },
  {
    id: 'usuarios',
    title: 'Usuarios',
    translate: 'MENU.USUARIOS',
    type: 'item',
    icon: 'users',
    url: 'usuarios'
  },
  {
    id: 'servicios',
    title: 'Servicios',
    translate: 'MENU.SERVICIOS',
    type: 'item',
    icon: 'coffee',
    url: 'servicios'
  },
  {
    id: 'pedidos',
    title: 'Pedidos',
    translate: 'MENU.PEDIDOS',
    type: 'item',
    icon: 'clipboard',
    url: 'pedidos'
  },
  {
    id: 'reportes',
    title: 'Reportes',
    translate: 'MENU.REPORTES',
    type: 'item',
    icon: 'bar-chart-2',
    url: 'reportes'
  }
]
