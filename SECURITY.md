# Security notes

Never commit Stripe secret keys, database passwords, OAuth client secrets, JWT signing keys, TLS private keys, or production environment files. Use environment variables or a deployment secret manager.

The original course repository contained credentials in source-controlled configuration. Treat those credentials as compromised even after removing them from the working tree.

Before using this application with real accounts:
1. Rotate/revoke the previously exposed Stripe secret.
2. Change the MySQL application password.
3. Review Auth0 credentials and rotate any credential that was actually secret.
4. If the repository was public, review its Git history and remove secrets from history.
5. Review provider logs for unexpected activity.

The checkout server recalculates order totals from database prices and verifies the Stripe PaymentIntent before creating an order. A real-money deployment should also add Stripe webhook processing as the final source of truth for asynchronous payment events, refunds and disputes.
