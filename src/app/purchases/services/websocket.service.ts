import { inject, Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket = inject(Socket);

  connectToPurchases() {
    this.socket.emit('joinPurchases');
  }

  onNewPurchaseCreated(): Observable<any> {
    return this.socket.fromEvent('newPurchaseCreated');
  }

  onNextInvoiceNumberUpdated(): Observable<any> {
    return this.socket.fromEvent('nextInvoiceNumberUpdated');
  }

  requestNextInvoiceNumber() {
    this.socket.emit('getNextInvoiceNumber');
  }

  disconnect() {
    this.socket.disconnect();
  }
}
