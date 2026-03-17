import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-butchery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <h1 class="text-3xl font-bold text-slate-800 mb-2">Despiece de Carne</h1>
        <p class="text-slate-500 mb-6">Módulo para la transformación de materia prima en cortes primarios (Planta Central).</p>
        
        <div class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <i class="pi pi-box text-5xl text-slate-300 mb-4"></i>
          <p class="text-slate-500 font-medium">Contenido en desarrollo</p>
          <p class="text-slate-400 text-sm">Este módulo permitirá registrar el despiece de canales y mermas naturales.</p>
        </div>
      </div>
    </div>
  `
})
export class ButcheryComponent {}
