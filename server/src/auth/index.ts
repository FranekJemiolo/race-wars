/**
 * Authentication Module Index
 * 
 * Exports all authentication-related services, middleware, and routes
 * for centralized access to authentication functionality.
 */

export { JwtService, jwtService } from './jwt.service'
export type { JwtPayload, TokenPair } from './jwt.service'

export { AuthService, authService } from './auth.service'
export type { LoginInput, RegisterInput, AuthResult, RefreshTokenInput } from './auth.service'

export {
  auth,
  requireAuth,
  optionalAuth,
  requireAdmin,
  requireOrganizer,
  requireUser,
  requireOwnership,
  requireEventOrganizer,
  authRateLimit,
  validateTokenFormat
} from './auth.middleware'
export type { AuthOptions } from './auth.middleware'

export { AuthController, authController } from './auth.controller'

export { default as authRoutes } from './routes'
