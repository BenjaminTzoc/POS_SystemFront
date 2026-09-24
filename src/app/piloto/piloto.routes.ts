import { Routes } from '@angular/router';
import { PilotoLayoutComponent } from './layout/piloto-layout.component';
import { MisViajesComponent } from './pages/mis-viajes/mis-viajes.component';
import { ViajeDetalleComponent } from './pages/viaje-detalle/viaje-detalle.component';
import { ParadaDetalleComponent } from './pages/parada-detalle/parada-detalle.component';

export const PILOTO_ROUTES: Routes = [
  {
    path: '',
    component: PilotoLayoutComponent,
    children: [
      { path: '', component: MisViajesComponent },
      { path: ':id/parada/:itemId', component: ParadaDetalleComponent },
      { path: ':id', component: ViajeDetalleComponent },
    ],
  },
];
