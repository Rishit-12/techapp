import { Component, OnInit } from '@angular/core';
import { OrderHistory } from '../../common/order-history';
import { OrderHistoryService } from '../../services/order-history.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css',
})
export class OrderHistoryComponent implements OnInit {
  orderHistoryList: OrderHistory[] = [];
  loading = true;
  errorMessage = '';

  constructor(private orderHistoryService: OrderHistoryService) {}

  ngOnInit(): void {
    this.orderHistoryService.getOrderHistory().subscribe({
      next: data => {
        this.orderHistoryList = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your orders. Please try again.';
        this.loading = false;
      }
    });
  }
}
