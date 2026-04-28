import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';

@Injectable()
export class JwtVerifierService {
  private client: JwksClient;

  constructor(private readonly config: ConfigService) {
    const jwksUri = this.config.get<string>('KEYCLOAK_JWKS_URI');

    if (!jwksUri) {
      throw new Error('KEYCLOAK_JWKS_URI is not defined in environment variables');
    }

    this.client = jwksClient({
      jwksUri,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });
  }

  private getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    this.client.getSigningKey(header.kid as string, (err, key) => {
      if (err) {
        return callback(err, undefined);
      }

      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    });
  }

  verifyToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.getKey.bind(this),
        {
          issuer: this.config.get<string>('KEYCLOAK_ISSUER_URI'),
          algorithms: ['RS256'],
          audience: this.config.get<string>('KEYCLOAK_CLIENT_ID'),
        },
        (err: any, decoded: any) => {
          if (err) return reject(err);
          resolve(decoded);
        },
      );
    });
  }
}
