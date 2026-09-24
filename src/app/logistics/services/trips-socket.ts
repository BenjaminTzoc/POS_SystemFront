import { ApplicationRef, Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TripsSocket extends Socket {
  constructor(appRef: ApplicationRef) {
    super(
      {
        url: `${environment.baseUrl}/trips`,
        options: {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          autoConnect: true,
        },
      },
      appRef,
    );
  }
}
