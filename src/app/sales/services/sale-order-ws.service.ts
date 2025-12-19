import { inject, Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SaleOrderWsService {
  private ws = inject(WebsocketService);

  newSaleCreated$ = this.ws.onNewSaleCreated().pipe(shareReplay(1));

  nextInvoiceNumberUpdated$ = this.ws.onNextInvoiceNumberUpdated().pipe(shareReplay(1));
}
