import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PkceService {
  generateCodeVerifier(): string {
    return crypto.randomBytes(64).toString('base64url');
  }

  generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
