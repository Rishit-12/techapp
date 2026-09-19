import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Luv2shopFormService } from '../../services/luv2shop-form.service';
import { Country } from '../../common/country';
import { State } from '../../common/state';
import { Luv2ShopValidators } from '../../validators/luv2-shop-validators';
import { CartService } from '../../services/cart.service';
import { CheckoutService } from '../../services/checkout.service';
import { Router } from '@angular/router';
import { Order } from '../../common/order';
import { OrderItem } from '../../common/order-item';
import { Purchase } from '../../common/purchase';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit, OnDestroy {

  checkoutFormGroup!: FormGroup;

  totalPrice = 0;
  totalQuantity = 0;

  countries: Country[] = [];
  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  isDisabled = false;
  loading = true;

  errorMessage = '';
  displayError = '';

  stripe: Stripe | null = null;
  cardElement: StripeCardElement | null = null;
  stripeReady = false;

  private subscriptions = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private luv2shopFormService: Luv2shopFormService,
    private cartService: CartService,
    private checkoutService: CheckoutService,
    private router: Router,
    private auth: AuthService
  ) { }

  ngOnInit(): void {

    this.reviewCartDetails();

    if (this.cartService.cartItems.length === 0) {
      this.router.navigateByUrl('/cart-details');
      return;
    }

    const theEmail = '';

    this.checkoutFormGroup = this.formBuilder.group({

      customer: this.formBuilder.group({
        firstName: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhitespace
        ]),

        lastName: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhitespace
        ]),

        email: new FormControl(theEmail, [
          Validators.required,
          Validators.email
        ])
      }),

      shippingAddress: this.createAddressGroup(),

      billingAddress: this.createAddressGroup()
    });

    /*
     * Get authenticated user's email from Auth0.
     */
    this.subscriptions.add(
      this.auth.user$.subscribe(user => {

        const email = user?.email ?? '';

        if (email && !this.email?.value) {
          this.email?.setValue(email);
        }

      })
    );

    /*
     * Load countries first.
     *
     * The Stripe card element is inside the rendered checkout page,
     * so we initialize Stripe after Angular has rendered the DOM.
     */
    this.subscriptions.add(
      this.luv2shopFormService.getCountries().subscribe({

        next: data => {

          this.countries = data;
          this.loading = false;

          /*
           * Wait one browser tick so Angular can render
           * #card-element before Stripe mounts the element.
           */
          setTimeout(() => {
            void this.setupStripePaymentForm();
          }, 0);

        },

        error: () => {

          this.loading = false;

          this.errorMessage =
            'Unable to load address data. Please refresh and try again.';
        }

      })
    );
  }

  /*
   * Creates a reusable address form group.
   */
  private createAddressGroup(): FormGroup {

    return this.formBuilder.group({

      street: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Luv2ShopValidators.notOnlyWhitespace
      ]),

      city: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Luv2ShopValidators.notOnlyWhitespace
      ]),

      state: new FormControl('', [
        Validators.required
      ]),

      country: new FormControl('', [
        Validators.required
      ]),

      zipCode: new FormControl('', [
        Validators.required,
        Validators.minLength(5),
        Luv2ShopValidators.notOnlyWhitespace
      ])

    });
  }

  /*
   * Initializes Stripe.js and mounts the secure card element.
   */
  private async setupStripePaymentForm(): Promise<void> {

    /*
     * Prevent duplicate Stripe initialization.
     */
    if (this.stripeReady) {
      return;
    }

    /*
     * Make sure Angular has rendered the Stripe container.
     */
    const cardElementContainer =
      document.getElementById('card-element');

    if (!cardElementContainer) {
      console.warn(
        'Stripe card container (#card-element) was not found.'
      );
      return;
    }

    try {

      /*
       * Load Stripe using the publishable key.
       *
       * IMPORTANT:
       * This must be a pk_test_... key during development.
       */
      this.stripe = await loadStripe(
        environment.stripePublishableKey
      );

      if (!this.stripe) {

        this.errorMessage =
          'Unable to load the secure payment form. Please refresh and try again.';

        console.error(
          'Stripe failed to initialize. Check stripePublishableKey.'
        );

        return;
      }

      /*
       * Create Stripe Elements.
       */
      const elements = this.stripe.elements();

      /*
       * Create secure card element.
       */
      this.cardElement = elements.create('card', {

        hidePostalCode: true,

        style: {

          base: {

            fontSize: '16px',

            color: '#1f2937',

            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

            '::placeholder': {
              color: '#9ca3af'
            }
          }

        }

      });

      /*
       * Mount Stripe's secure iframe inside our container.
       */
      this.cardElement.mount('#card-element');

      /*
       * Listen for card validation errors.
       */
      this.cardElement.on('change', event => {

        this.displayError =
          event.error?.message ?? '';

      });

      /*
       * Stripe is now ready.
       */
      this.stripeReady = true;

    } catch (error) {

      console.error(
        'Stripe initialization error:',
        error
      );

      this.errorMessage =
        'Unable to load the secure payment form. Please refresh and try again.';
    }
  }

  /*
   * Cleanup subscriptions and Stripe Elements.
   */
  ngOnDestroy(): void {

    this.subscriptions.unsubscribe();

    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  /*
   * Updates cart quantity and total price.
   */
  reviewCartDetails(): void {

    this.subscriptions.add(
      this.cartService.totalQuantity.subscribe(
        value => this.totalQuantity = value
      )
    );

    this.subscriptions.add(
      this.cartService.totalPrice.subscribe(
        value => this.totalPrice = value
      )
    );
  }

  /*
   * Form getters.
   */
  get firstName() {
    return this.checkoutFormGroup.get(
      'customer.firstName'
    );
  }

  get lastName() {
    return this.checkoutFormGroup.get(
      'customer.lastName'
    );
  }

  get email() {
    return this.checkoutFormGroup.get(
      'customer.email'
    );
  }

  get shippingAddressStreet() {
    return this.checkoutFormGroup.get(
      'shippingAddress.street'
    );
  }

  get shippingAddressCity() {
    return this.checkoutFormGroup.get(
      'shippingAddress.city'
    );
  }

  get shippingAddressState() {
    return this.checkoutFormGroup.get(
      'shippingAddress.state'
    );
  }

  get shippingAddressCountry() {
    return this.checkoutFormGroup.get(
      'shippingAddress.country'
    );
  }

  get shippingAddressZipCode() {
    return this.checkoutFormGroup.get(
      'shippingAddress.zipCode'
    );
  }

  get billingAddressStreet() {
    return this.checkoutFormGroup.get(
      'billingAddress.street'
    );
  }

  get billingAddressCity() {
    return this.checkoutFormGroup.get(
      'billingAddress.city'
    );
  }

  get billingAddressState() {
    return this.checkoutFormGroup.get(
      'billingAddress.state'
    );
  }

  get billingAddressCountry() {
    return this.checkoutFormGroup.get(
      'billingAddress.country'
    );
  }

  get billingAddressZipCode() {
    return this.checkoutFormGroup.get(
      'billingAddress.zipCode'
    );
  }

  /*
   * Copies shipping address into billing address.
   */
  copyShippingAddressToBillingAddress(
    event: Event
  ): void {

    const checked =
      (event.target as HTMLInputElement).checked;

    if (checked) {

      this.checkoutFormGroup
        .get('billingAddress')
        ?.setValue(
          this.checkoutFormGroup
            .get('shippingAddress')
            ?.value
        );

      this.billingAddressStates = [
        ...this.shippingAddressStates
      ];

    } else {

      this.checkoutFormGroup
        .get('billingAddress')
        ?.reset();

      this.billingAddressStates = [];
    }
  }

  /*
   * Loads states based on selected country.
   */
  getStates(
    formGroupName:
      'shippingAddress' | 'billingAddress'
  ): void {

    const formGroup =
      this.checkoutFormGroup.get(formGroupName);

    const country: Country | null =
      formGroup?.get('country')?.value;

    if (!country?.code) {

      formGroup?.get('state')?.reset();

      if (formGroupName === 'shippingAddress') {
        this.shippingAddressStates = [];
      } else {
        this.billingAddressStates = [];
      }

      return;
    }

    this.subscriptions.add(
      this.luv2shopFormService
        .getStates(country.code)
        .subscribe({

          next: data => {

            if (formGroupName === 'shippingAddress') {

              this.shippingAddressStates = data;

            } else {

              this.billingAddressStates = data;
            }

            /*
             * Select the first state when available.
             */
            formGroup
              ?.get('state')
              ?.setValue(data[0] ?? null);
          },

          error: () => {

            this.errorMessage =
              'Unable to load states for the selected country.';
          }

        })
    );
  }

  /*
   * Main checkout/payment flow.
   */
  onSubmit(): void {

    this.errorMessage = '';

    /*
     * Do not allow checkout until:
     *
     * - form is valid
     * - Stripe is loaded
     * - Stripe card element is mounted
     * - card has no validation errors
     */
    console.log('========== PAY BUTTON CLICKED ==========');
    console.log('Form valid:', this.checkoutFormGroup.valid);
    console.log('Stripe:', this.stripe);
    console.log('Card Element:', this.cardElement);
    console.log('Stripe Ready:', this.stripeReady);
    console.log('Display Error:', this.displayError);
    console.log('Cart items:', this.cartService.cartItems);

    if (
      this.checkoutFormGroup.invalid ||
      !this.stripe ||
      !this.cardElement ||
      !this.stripeReady ||
      this.displayError
    ) {
      console.log('PAYMENT BLOCKED BEFORE API CALL');

      this.checkoutFormGroup.markAllAsTouched();

      if (this.displayError) {
        this.errorMessage = this.displayError;
      }

      return;
    }

    /*
     * Cart cannot be empty.
     */
    if (this.cartService.cartItems.length === 0) {

      this.errorMessage =
        'Your cart is empty.';

      return;
    }

    const shipping =
      this.checkoutFormGroup
        .get('shippingAddress')!
        .value;

    const billing =
      this.checkoutFormGroup
        .get('billingAddress')!
        .value;

    const shippingCountry: Country =
      shipping.country;

    const shippingState: State =
      shipping.state;

    const billingCountry: Country =
      billing.country;

    const billingState: State =
      billing.state;

    /*
     * Build purchase request.
     */
    const purchase = new Purchase();

    purchase.customer =
      this.checkoutFormGroup
        .get('customer')!
        .value;

    purchase.shippingAddress = {

      ...shipping,

      state:
        shippingState?.name ?? '',

      country:
        shippingCountry?.name ?? ''
    };

    purchase.billingAddress = {

      ...billing,

      state:
        billingState?.name ?? '',

      country:
        billingCountry?.name ?? ''
    };

    /*
     * Order information.
     *
     * Backend remains authoritative for
     * actual product prices and total amount.
     */
    purchase.order = new Order();

    purchase.order.totalQuantity =
      this.totalQuantity;

    purchase.order.totalPrice =
      this.totalPrice;

    purchase.orderItems =
      this.cartService.cartItems.map(
        item => new OrderItem(item)
      );

    /*
     * Prevent duplicate checkout clicks.
     */
    this.isDisabled = true;

    /*
     * Generate a unique idempotency key for
     * this checkout attempt.
     */
    const idempotencyKey =
      crypto.randomUUID();

    /*
     * Ask backend to create Stripe PaymentIntent.
     *
     * Backend calculates the authoritative amount.
     */
    this.checkoutService
      .createPaymentIntent(
        purchase,
        idempotencyKey
      )
      .subscribe({

        next: (paymentIntent: any) => {

          purchase.paymentIntentId =
            paymentIntent.id;

          /*
           * Confirm payment securely with Stripe.
           */
          this.stripe!
            .confirmCardPayment(
              paymentIntent.client_secret,
              {

                payment_method: {

                  card: this.cardElement!,

                  billing_details: {

                    email:
                      purchase.customer.email,

                    name:
                      `${purchase.customer.firstName} ${purchase.customer.lastName}`,

                    address: {

                      line1:
                        purchase.billingAddress.street,

                      city:
                        purchase.billingAddress.city,

                      state:
                        purchase.billingAddress.state,

                      postal_code:
                        purchase.billingAddress.zipCode,

                      country:
                        billingCountry?.code
                    }
                  }
                }
              }
            )
            .then((result: any) => {

              /*
               * Stripe payment failed.
               */
              if (result.error) {

                this.errorMessage =
                  result.error.message ??
                  'Payment could not be completed.';

                this.isDisabled = false;

                return;
              }

              /*
               * Only proceed if Stripe reports success.
               */
              if (
                result.paymentIntent?.status !==
                'succeeded'
              ) {

                this.errorMessage =
                  'Payment was not completed. Please try again.';

                this.isDisabled = false;

                return;
              }

              /*
               * Payment succeeded.
               *
               * Now create the order in our backend.
               */
              this.checkoutService
                .placeOrder(purchase)
                .subscribe({

                  next: response => {

                    /*
                     * Clear cart only after
                     * order creation succeeds.
                     */
                    this.cartService.clearCart();

                    this.router.navigate(
                      ['/order-confirmation'],
                      {
                        queryParams: {
                          trackingNumber:
                            response.orderTrackingNumber
                        }
                      }
                    );
                  },

                  error: err => {

                    this.errorMessage =
                      err?.error?.message ??
                      'Payment succeeded, but the order could not be recorded. Please contact support with your payment confirmation.';

                    this.isDisabled = false;
                  }

                });
            })
            .catch(() => {

              this.errorMessage =
                'Unable to complete the payment. Please try again.';

              this.isDisabled = false;
            });
        },

        error: err => {

          this.errorMessage =
            err?.error?.message ??
            'Unable to start payment. Please check your cart and try again.';

          this.isDisabled = false;
        }

      });
  }
}