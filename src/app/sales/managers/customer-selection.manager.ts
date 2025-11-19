import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ICustomer } from '../interfaces/customer.interface';

@Injectable({
  providedIn: 'root',
})
export class CustomerSelectionManager {
  private customerSubject = new BehaviorSubject<ICustomer | null>(null);
  customer$ = this.customerSubject.asObservable();

  private customerType: 'R' | 'Q' = 'R';

  setCustomerType(type: 'R' | 'Q') {
    this.customerType = type;
  }

  getCustomerType() {
    return this.customerType;
  }

  selectCustomer(customer: ICustomer) {
    this.customerSubject.next(customer);
  }

  clearCustomer() {
    this.customerSubject.next(null);
  }

  getSelectedCustomer(): ICustomer | null {
    return this.customerSubject.getValue();
  }
}
