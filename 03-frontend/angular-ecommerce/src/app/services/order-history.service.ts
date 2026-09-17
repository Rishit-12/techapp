import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OrderHistory } from '../common/order-history';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderHistoryService {
  private orderUrl = `${environment.luv2shopApiUrl}/orders`;

  constructor(private httpClient: HttpClient) {}

  getOrderHistory(): Observable<OrderHistory[]> {
    return this.httpClient.get<OrderHistory[]>(`${this.orderUrl}/me`);
  }
}
