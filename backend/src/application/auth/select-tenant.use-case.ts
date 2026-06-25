import { unauthenticated } from '../../domain/shared/errors';
import type { MembershipRepository, UserRepository } from '../../domain/repositories';
import type { TokenService } from '../ports';
import type { LoginResponse } from './auth-dtos';
import { buildLoginResponse } from './build-login-response';

export class SelectTenantUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(selectionToken: string, tenantId: string): Promise<LoginResponse> {
    try {
      const payload = this.tokenService.verify(selectionToken);
      if (payload.purpose !== 'tenant-selection' || !payload.sub) {
        throw unauthenticated('Token de selección inválido');
      }

      const user = await this.users.findById(payload.sub);
      if (!user || !user.active) throw unauthenticated('Credenciales incorrectas');

      return buildLoginResponse(user, tenantId, this.memberships, this.tokenService);
    } catch (err) {
      if (err instanceof Error && err.name === 'ApplicationError') throw err;
      throw unauthenticated('Token de selección inválido');
    }
  }
}
