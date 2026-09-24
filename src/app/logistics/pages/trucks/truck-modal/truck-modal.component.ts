import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { TrucksService } from '../../../services/trucks.service';
import { Truck, CreateTruckDto, UpdateTruckDto, TruckStatus } from '../../../interfaces/truck.interface';
import { StandardModalComponent } from '../../../../shared/components/standard-modal/standard-modal.component';
import { PrimaryButtonComponent } from '../../../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../../../shared/components/secondary-button/secondary-button.component';

@Component({
  selector: 'app-truck-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    StandardModalComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
  ],
  templateUrl: './truck-modal.component.html',
})
export class TruckModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() truck: Truck | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Truck>();

  private fb = inject(FormBuilder);
  private trucksService = inject(TrucksService);
  private messageService = inject(MessageService);

  form: FormGroup;
  saving = false;
  loadingDrivers = false;
  drivers: any[] = [];

  statusOptions = [
    { label: 'Activo / Operativo', value: 'active' },
    { label: 'En Mantenimiento', value: 'maintenance' },
    { label: 'Inactivo / Fuera de Servicio', value: 'inactive' },
  ];

  get modalTitle(): string {
    return this.truck ? 'Editar vehículo' : 'Registrar vehículo';
  }

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      licensePlate: ['', [Validators.required, Validators.maxLength(20)]],
      brand: [''],
      model: [''],
      year: [new Date().getFullYear(), [Validators.min(1970), Validators.max(2050)]],
      capacity: [null, [Validators.min(0)]],
      status: ['active' as TruckStatus, [Validators.required]],
      defaultDriverId: [null],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadDrivers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['truck'] && this.truck) {
      this.form.patchValue({
        name: this.truck.name,
        licensePlate: this.truck.licensePlate,
        brand: this.truck.brand || '',
        model: this.truck.model || '',
        year: this.truck.year || new Date().getFullYear(),
        capacity: this.truck.capacity || null,
        status: this.truck.status || 'active',
        defaultDriverId: this.truck.defaultDriver?.id || null,
        notes: this.truck.notes || '',
      });
    } else if (changes['visible'] && this.visible && !this.truck) {
      this.form.reset({
        name: '',
        licensePlate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        capacity: null,
        status: 'active',
        defaultDriverId: null,
        notes: '',
      });
    }
  }

  loadDrivers(): void {
    this.loadingDrivers = true;
    this.trucksService.getDrivers().subscribe({
      next: (res) => {
        const users: any[] = res.data || [];
        let filtered = users.filter((user) =>
          user.roles?.some((role: any) => {
            const roleName = (typeof role === 'string' ? role : role.name || '').toLowerCase();
            return (
              roleName.includes('piloto') ||
              roleName.includes('chofer') ||
              roleName.includes('conductor') ||
              roleName.includes('driver')
            );
          }) ||
          (user.role && (
            user.role.toLowerCase().includes('piloto') ||
            user.role.toLowerCase().includes('chofer') ||
            user.role.toLowerCase().includes('conductor') ||
            user.role.toLowerCase().includes('driver')
          ))
        );

        if (filtered.length === 0) {
          filtered = users;
        }

        this.drivers = filtered.map((u: any) => ({
          label: `${u.name || u.firstName || u.username} (${u.email || 'Usuario'})`,
          value: u.id,
        }));
        this.loadingDrivers = false;
      },
      error: () => {
        this.loadingDrivers = false;
      },
    });
  }

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formVal = this.form.value;

    if (this.truck?.id) {
      const updateDto: UpdateTruckDto = {
        name: formVal.name.trim(),
        licensePlate: formVal.licensePlate.trim().toUpperCase(),
        brand: formVal.brand?.trim() || undefined,
        model: formVal.model?.trim() || undefined,
        year: formVal.year ? Number(formVal.year) : undefined,
        capacity: formVal.capacity ? Number(formVal.capacity) : undefined,
        status: formVal.status,
        defaultDriverId: formVal.defaultDriverId || undefined,
        notes: formVal.notes?.trim() || undefined,
      };

      this.trucksService.updateTruck(this.truck.id, updateDto).subscribe({
        next: (res) => {
          this.saving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Vehículo actualizado',
            detail: `El vehículo ${res.data.name} se actualizó correctamente.`,
          });
          this.saved.emit(res.data);
          this.onClose();
        },
        error: (err) => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo actualizar el vehículo.',
          });
        },
      });
    } else {
      const createDto: CreateTruckDto = {
        name: formVal.name.trim(),
        licensePlate: formVal.licensePlate.trim().toUpperCase(),
        brand: formVal.brand?.trim() || undefined,
        model: formVal.model?.trim() || undefined,
        year: formVal.year ? Number(formVal.year) : undefined,
        capacity: formVal.capacity ? Number(formVal.capacity) : undefined,
        status: formVal.status,
        defaultDriverId: formVal.defaultDriverId || undefined,
        notes: formVal.notes?.trim() || undefined,
      };

      this.trucksService.createTruck(createDto).subscribe({
        next: (res) => {
          this.saving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Vehículo registrado',
            detail: `El vehículo ${res.data.name} fue registrado con éxito.`,
          });
          this.saved.emit(res.data);
          this.onClose();
        },
        error: (err) => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo crear el vehículo.',
          });
        },
      });
    }
  }
}
