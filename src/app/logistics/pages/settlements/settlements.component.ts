import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { LogisticsService } from '../../services/logistics.service';
import { RouteDispatch } from '../../interfaces/route-dispatch.interface';

@Component({
  selector: 'app-settlements',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    TagModule, 
    TooltipModule,
    DatePipe,
    CurrencyPipe
  ],
  template: `
    <div class="py-4 px-0 md:px-6 bg-gray-50/30 min-h-screen">
      <div class="max-w-[1700px] mx-auto px-4 md:px-0 mb-6 md:mb-8">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div class="w-full md:max-w-[50%]">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <i class="pi pi-calculator text-indigo-500 text-2xl md:text-3xl"></i>
              Liquidaciones
            </h1>
            <p class="text-gray-500 mt-1 md:mt-2 text-sm md:text-md">
              Historial de cierres y conciliaciones por sucursal.
            </p>
          </div>
        </div>
      </div>

      <div class="max-w-[1700px] mx-auto">
        <div class="bg-transparent md:bg-white rounded-none md:rounded-xl md:border md:border-slate-300 overflow-hidden md:shadow-sm">
          <p-table 
            [value]="closedDispatches()" 
            [loading]="loading()" 
            [paginator]="true" 
            [rows]="10"
            styleClass="p-datatable-modern block lg:min-w-full"
            [responsiveLayout]="'scroll'"
          >
            <ng-template #header>
              <tr class="h-14 hidden lg:table-row bg-slate-50">
                <th class="!pl-8 tracking-widest text-slate-400">Fecha Cierre</th>
                <th class="tracking-widest text-slate-400">Sucursal</th>
                <th class="text-center tracking-widest text-slate-400">Venta Total</th>
                <th class="text-center tracking-widest text-slate-400">Mermas</th>
                <th class="text-center tracking-widest text-slate-400">Devoluciones</th>
                <th class="!pr-8 text-right tracking-widest text-slate-400">Acciones</th>
              </tr>
            </ng-template>

            <ng-template #body let-dispatch>
              <tr class="group hover:bg-transparent lg:hover:bg-slate-50 transition-all border-b border-slate-100 block lg:table-row bg-transparent last:border-0 lg:h-16">
                <!-- VISTA MÓVIL (Tarjeta) -->
                <td class="lg:hidden block !p-0 border-none bg-transparent">
                  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 mx-4 my-3 p-5 flex flex-col gap-4">
                    
                    <div class="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div class="flex flex-col gap-1">
                        <span class="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Sucursal</span>
                        <span class="text-sm font-bold text-slate-800">{{ dispatch.branch?.name }}</span>
                      </div>
                      <div class="flex flex-col text-right">
                        <span class="text-xs font-semibold text-slate-700">{{ dispatch.liquidatedAt | date:'dd/MM/yyyy' }}</span>
                        <span class="text-[10px] text-indigo-500 font-mono tracking-widest uppercase mt-0.5">{{ dispatch.liquidatedAt | date:'hh:mm a' }}</span>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 relative py-1">
                      <div class="absolute left-1/2 top-1 bottom-1 w-px bg-slate-100 -translate-x-1/2"></div>
                      
                      <div class="flex flex-col">
                        <span class="text-[9px] uppercase text-indigo-500 font-bold tracking-widest mb-1.5">Venta Total</span>
                        <span class="font-black text-indigo-600 text-sm bg-indigo-50/50 py-1.5 px-3 rounded-lg w-full text-center">{{ calculateTotalSold(dispatch) | currency:'Q ' }}</span>
                      </div>

                      <div class="flex flex-col gap-2">
                        <div class="flex justify-between items-center bg-rose-50 px-3 py-1.5 rounded-lg w-full">
                          <span class="text-[9px] uppercase text-rose-500 font-bold tracking-widest">Mermas</span>
                          <span class="text-rose-600 text-xs font-bold">{{ calculateTotalWaste(dispatch) }} unds</span>
                        </div>
                        <div class="flex justify-between items-center bg-amber-50 px-3 py-1.5 rounded-lg w-full">
                          <span class="text-[9px] uppercase text-amber-500 font-bold tracking-widest">Dev</span>
                          <span class="text-amber-600 text-xs font-bold">{{ calculateTotalReturns(dispatch) }} unds</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 mt-1 bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                      <p-button 
                        icon="pi pi-file-pdf" 
                        variant="text"
                        rounded="true"
                        pTooltip="Exportar"
                        styleClass="!text-rose-500 hover:!bg-rose-50 bg-white shadow-sm border border-slate-200"
                      />
                      <p-button 
                        icon="pi pi-eye" 
                        variant="text"
                        rounded="true"
                        pTooltip="Ver Detalle"
                        styleClass="!text-indigo-500 hover:!bg-indigo-50 bg-white shadow-sm border border-slate-200"
                      />
                    </div>
                  </div>
                </td>

                <!-- DESKTOP VIEW -->
                <td class="!pl-8 hidden lg:table-cell py-4">
                  <div class="flex flex-col">
                    <span class="font-bold text-slate-700 text-sm">{{ dispatch.liquidatedAt | date:'dd/MM/yyyy' }}</span>
                    <span class="text-[12px] text-indigo-500 font-medium">{{ dispatch.liquidatedAt | date:'hh:mm a' }}</span>
                  </div>
                </td>
                <td class="hidden lg:table-cell">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <i class="pi pi-building text-indigo-500 text-[10px]"></i>
                    </div>
                    <span class="font-semibold text-slate-700 text-sm">{{ dispatch.branch?.name }}</span>
                  </div>
                </td>
                <td class="text-center hidden lg:table-cell">
                  <span class="font-black text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg text-sm">{{ calculateTotalSold(dispatch) | currency:'Q ' }}</span>
                </td>
                <td class="text-center hidden lg:table-cell">
                  <span class="px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-md text-[11px] font-bold">
                    {{ calculateTotalWaste(dispatch) }} unidades
                  </span>
                </td>
                <td class="text-center hidden lg:table-cell">
                  <span class="px-2.5 py-1.5 bg-amber-50 text-amber-600 rounded-md text-[11px] font-bold">
                    {{ calculateTotalReturns(dispatch) }} unidades
                  </span>
                </td>
                <td class="!pr-8 text-right hidden lg:table-cell">
                  <p-button 
                    icon="pi pi-file-pdf" 
                    variant="text"
                    rounded="true"
                    pTooltip="Exportar Comprobante"
                    styleClass="!text-rose-500 hover:!bg-rose-50"
                  />
                  <p-button 
                    icon="pi pi-eye" 
                    variant="text"
                    rounded="true"
                    pTooltip="Ver Detalle"
                    styleClass="!text-indigo-500 hover:!bg-indigo-50"
                  />
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="6" class="text-center !py-24 hidden lg:table-cell">
                  <div class="flex flex-col items-center gap-4">
                    <i class="pi pi-inbox text-slate-200" style="font-size: 5rem"></i>
                    <div class="flex flex-col items-center gap-1">
                      <p class="text-slate-500 font-bold text-xl">No hay liquidaciones</p>
                      <p class="text-slate-400 text-sm max-w-[280px] text-center">
                        Ninguna sucursal ha cerrado su operación del día todavía.
                      </p>
                    </div>
                  </div>
                </td>
                <!-- Empty state for mobile -->
                <td class="lg:hidden block !p-0 border-none bg-transparent">
                  <div class="bg-white rounded-2xl border border-slate-200 mx-4 my-8 p-10 flex flex-col items-center gap-4 text-center">
                    <i class="pi pi-inbox text-slate-200" style="font-size: 4rem"></i>
                    <div class="flex flex-col gap-1">
                      <p class="text-slate-500 font-bold">No hay liquidaciones</p>
                      <p class="text-slate-400 text-xs">Las operaciones cerradas se mostrarán aquí.</p>
                    </div>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
  `
})
export class SettlementsComponent implements OnInit {
  private logisticsService = inject(LogisticsService);
  
  closedDispatches = signal<RouteDispatch[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.logisticsService.getRouteDispatches().subscribe({
      next: (res) => {
        // Filter only closed/liquidated dispatches
        this.closedDispatches.set(res.data.filter(d => d.status === 'closed'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  calculateTotalSold(dispatch: RouteDispatch): number {
    // This is a placeholder calculation, usually we would multiply by price
    return (dispatch.items || []).reduce((acc, item) => acc + (item.soldQuantity || 0), 0) * 10; // Dummy price factor
  }

  calculateTotalWaste(dispatch: RouteDispatch): number {
    return (dispatch.items || []).reduce((acc, item) => acc + (item.wasteQuantity || 0), 0);
  }

  calculateTotalReturns(dispatch: RouteDispatch): number {
    return (dispatch.items || []).reduce((acc, item) => acc + (item.returnedQuantity || 0), 0);
  }
}
