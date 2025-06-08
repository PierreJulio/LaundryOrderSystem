import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { OrderService } from '../../../services/order.service';
import { CreateOrderRequest } from '../../../models/order';
import { LaundryItem } from '../../../models/laundry-item';

@Component({
  selector: 'app-order-form',
  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextarea,
    CalendarModule,
    ToastModule,
    CurrencyPipe,
    TableModule,
    DialogModule
  ],
  providers: [MessageService],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss'
})
export class OrderFormComponent implements OnInit {
  orderForm: FormGroup;
  itemForm: FormGroup;
  showItemDialog = false;
  submitted = false;
  loading = false;
  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.orderForm = this.fb.group({
      orderDate: [new Date(), Validators.required],
      customerName: ['', Validators.required],
      customerSurname: ['', Validators.required],
      items: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      reason: [''],
      comment: ['']
    });    this.itemForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      description: [''],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
  }

  get items(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }

  showAddItemDialog(): void {
    this.itemForm.reset({quantity: 1});
    this.showItemDialog = true;
  }
  addItem(): void {
    if (this.itemForm.valid) {
      const item = this.itemForm.value;
      this.items.push(this.fb.group({
        name: [item.name, Validators.required],
        price: [item.price, [Validators.required, Validators.min(0.01)]],
        description: [item.description || ''],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]]
      }));
      this.showItemDialog = false;
    }
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.orderForm.invalid) {
      return;
    }

    this.loading = true;    // Transformer les articles pour qu'ils correspondent au format attendu par le backend
    const laundryItems = this.orderForm.value.items.map((item: any) => {
      return {
        name: item.name,
        price: item.price,
        description: item.description || ''
        // On n'inclut pas la propriété quantity qui n'est pas attendue par le backend
      };
    });

    const orderRequest: CreateOrderRequest = {
      orderDate: this.orderForm.value.orderDate,
      customerName: this.orderForm.value.customerName,
      customerSurname: this.orderForm.value.customerSurname,
      laundryItems: laundryItems,
      reason: this.orderForm.value.reason,
      comment: this.orderForm.value.comment
    };

    this.orderService.createOrder(orderRequest).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Commande créée avec succès'
        });
        setTimeout(() => {
          this.router.navigate(['/orders']);
        }, 1500);
      },
      error: error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Une erreur est survenue lors de la création de la commande'
        });
        this.loading = false;
      }
    });
  }
}
