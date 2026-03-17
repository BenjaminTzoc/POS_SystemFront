import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  LOCALE_ID,
  DEFAULT_CURRENCY_CODE
} from '@angular/core';
import localeEsGt from '@angular/common/locales/es-GT';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeEsGt);
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import Aura from '@primeuix/themes/aura';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor';
import { provideSocketIo } from 'ngx-socket-io';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-GT' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'GTQ' },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.my-app-dark',
        },
      },
      translation: {
        dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
        monthNames: [
          'Enero',
          'Febrero',
          'Marzo',
          'Abril',
          'Mayo',
          'Junio',
          'Julio',
          'Agosto',
          'Septiembre',
          'Octubre',
          'Noviembre',
          'Diciembre',
        ],
        monthNamesShort: [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ],
        today: 'Hoy',
      },
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideSocketIo({
      url: `${environment.baseUrl}/purchases`,
      options: {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        autoConnect: true,
      },
    }),
    provideSocketIo({
      url: `${environment.baseUrl}/sales`,
      options: {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        autoConnect: true,
      },
    }),
  ],
};
