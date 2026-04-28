import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtVerifierService } from '../jwt/jwt-service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtVerifier: JwtVerifierService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData();

    // Expect token from API Gateway
    const token = data?.headers?.authorization?.replace('Bearer ', '') || data?.token;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decoded = await this.jwtVerifier.verifyToken(token);

      // attach user
      data.user = decoded;

      return true;
    } catch (err) {
      throw new UnauthorizedException(err.message);
    }
  }
}
