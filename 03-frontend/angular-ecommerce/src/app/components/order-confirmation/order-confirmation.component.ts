import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css'
})
export class OrderConfirmationComponent {
  trackingNumber = '';

  constructor(route: ActivatedRoute) {
    this.trackingNumber = route.snapshot.queryParamMap.get('trackingNumber') ?? '';
  }
}
