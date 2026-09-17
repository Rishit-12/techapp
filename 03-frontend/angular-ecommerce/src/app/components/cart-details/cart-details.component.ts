import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../common/cart-item';

@Component({
  selector: 'app-cart-details',
  templateUrl: './cart-details.component.html',
  styleUrl: './cart-details.component.css'
})
export class CartDetailsComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalPrice = 0;
  totalQuantity = 0;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartItems = this.cartService.cartItems;
    this.cartService.totalPrice.subscribe(value => this.totalPrice = value);
    this.cartService.totalQuantity.subscribe(value => this.totalQuantity = value);
  }

  incrementQuantity(item: CartItem): void {
    this.cartService.incrementQuantity(item);
  }

  decrementQuantity(item: CartItem): void {
    this.cartService.decrementQuantity(item);
  }

  remove(item: CartItem): void {
    this.cartService.remove(item);
  }
}
