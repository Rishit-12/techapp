import { Injectable } from '@angular/core';
import { CartItem } from '../common/cart-item';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartItems: CartItem[] = [];
  totalPrice = new BehaviorSubject<number>(0);
  totalQuantity = new BehaviorSubject<number>(0);
  storage: Storage = localStorage;

  constructor() {
    const data = this.storage.getItem('cartItems');
    if (data) {
      try {
        this.cartItems = JSON.parse(data) as CartItem[];
      } catch {
        this.cartItems = [];
        this.storage.removeItem('cartItems');
      }
    }
    this.computeCartTotals();
  }

  addToCart(theCartItem: CartItem): void {
    const existing = this.cartItems.find(item => item.id === theCartItem.id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + theCartItem.quantity, 50);
    } else {
      theCartItem.quantity = Math.min(Math.max(theCartItem.quantity, 1), 50);
      this.cartItems.push(theCartItem);
    }
    this.computeCartTotals();
  }

  incrementQuantity(item: CartItem): void {
    if (item.quantity < 50) {
      item.quantity++;
      this.computeCartTotals();
    }
  }

  decrementQuantity(item: CartItem): void {
    item.quantity--;
    if (item.quantity <= 0) {
      this.remove(item);
    } else {
      this.computeCartTotals();
    }
  }

  remove(item: CartItem): void {
    const index = this.cartItems.findIndex(cartItem => cartItem.id === item.id);
    if (index >= 0) {
      this.cartItems.splice(index, 1);
      this.computeCartTotals();
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.computeCartTotals();
  }

  computeCartTotals(): void {
    const totalPrice = this.cartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity, 0
    );
    const totalQuantity = this.cartItems.reduce(
      (sum, item) => sum + item.quantity, 0
    );

    this.totalPrice.next(Number(totalPrice.toFixed(2)));
    this.totalQuantity.next(totalQuantity);
    this.storage.setItem('cartItems', JSON.stringify(this.cartItems));
  }
}
