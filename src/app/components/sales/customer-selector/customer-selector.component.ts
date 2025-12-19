import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';

@Component({
  selector: 'app-customer-selector',
  imports: [ReactiveFormsModule, FormsModule, RadioButtonModule],
  templateUrl: './customer-selector.component.html',
  styleUrl: './customer-selector.component.css',
})
export class CustomerSelectorComponent {
  @Input() customerForm!: FormGroup;
  @Input() guestCustomerForm!: FormGroup;
  @Input() isEditing: boolean = false;
  @Input() customerTypes!: any[];
  @Input() selectedCustomerType!: any;

  @Output() customerTypeChange = new EventEmitter<string>();

  onCustomerTypeChange(type: string) {
    this.customerTypeChange.emit(type);
  }
}
