import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Purchase } from '../common/purchase';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private purchaseUrl = `${environment.luv2shopApiUrl}/checkout/purchase`;
  private paymentIntentUrl = `${environment.luv2shopApiUrl}/checkout/payment-intent`;

  constructor(private httpClient: HttpClient) {}

  placeOrder(purchase: Purchase): Observable<{ orderTrackingNumber: string }> {
    return this.httpClient.post<{ orderTrackingNumber: string }>(this.purchaseUrl, purchase);
  }

  createPaymentIntent(purchase: Purchase, idempotencyKey: string): Observable<any> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.httpClient.post<any>(this.paymentIntentUrl, purchase, { headers });
  }
}
