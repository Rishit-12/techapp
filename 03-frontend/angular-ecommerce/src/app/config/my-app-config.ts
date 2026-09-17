import { environment } from '../../environments/environment';

export default {
  auth: {
    domain: environment.auth0Domain,
    clientId: environment.auth0ClientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: environment.auth0Audience,
      scope: 'openid profile email',
    },
  },

  httpInterceptor: {
    allowedList: [
      `${environment.luv2shopApiUrl}/orders/*`,
      `${environment.luv2shopApiUrl}/checkout/*`,
    ],
  },
};