import { forbidden, unauthenticated } from '../../domain/shared/errors';
import type { MembershipRepository, UserRepository } from '../../domain/repositories';
import type { PasswordHasher, TokenService } from '../ports';
import type { LoginResult } from './auth-dtos';
import { buildLoginResponse } from './build-login-response';

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    const passwordMatch = user ? await this.passwordHasher.compare(password, user.passwordHash) : false;

    if (!user || !passwordMatch || !user.active) throw unauthenticated('Credenciales incorrectas');

    const memberships = await this.memberships.findActiveByUser(user.id);
    if (memberships.length === 0) throw forbidden('No tienes acceso a ningún centro activo');

    if (memberships.length === 1) {
      return buildLoginResponse(user, memberships[0].tenantId, this.memberships, this.tokenService);
    }

    return {
      tenantSelectionRequired: true,
      selectionToken: this.tokenService.signSelectionToken(user.id),
      tenants: memberships.map((membership) => ({
        id: membership.tenant!.id,
        organizationId: membership.tenant!.organizationId,
        name: membership.tenant!.name,
        organizationName: membership.tenant!.organization!.name,
        role: membership.role,
      })),
    };
  }
}
