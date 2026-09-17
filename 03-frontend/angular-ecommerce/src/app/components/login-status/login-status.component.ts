import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login-status',
  templateUrl: './login-status.component.html',
  styleUrl: './login-status.component.css'
})
export class LoginStatusComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  userFullName?: string;
  private subscriptions = new Subscription();

  constructor(
    private auth: AuthService,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.auth.isAuthenticated$.subscribe(authenticated => {
        this.isAuthenticated = authenticated;
      })
    );

    this.subscriptions.add(
      this.auth.user$.subscribe(user => {
        this.userFullName = user?.name || user?.email || 'Account';
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  login(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({
      logoutParams: { returnTo: this.doc.location.origin }
    });
  }
}
