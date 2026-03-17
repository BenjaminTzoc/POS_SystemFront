import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <h1 class="text-3xl font-bold text-slate-800 mb-2">Devoluciones de Sucursal</h1>
        <p class="text-slate-500 mb-6">Registro de productos sobrantes que regresan a Planta Central.</p>
        
        <div class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <i class="pi pi-backward text-5xl text-slate-300 mb-4"></i>
          <p class="text-slate-500 font-medium">Contenido en desarrollo</p>
          <p class="text-slate-400 text-sm">Este módulo permitirá cuadrar los productos no vendidos al final del día.</p>
        </div>
      </div>
    </div>
  `
})
export class ReturnsComponent {}
