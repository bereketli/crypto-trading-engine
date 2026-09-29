class AuthError(Exception):
    """Base class for authentication/authorization domain errors."""


class EmailAlreadyRegisteredError(AuthError):
    pass


class UsernameAlreadyTakenError(AuthError):
    pass


class InvalidCredentialsError(AuthError):
    pass


class InactiveUserError(AuthError):
    pass


class InvalidRefreshTokenError(AuthError):
    pass


class UserNotFoundError(AuthError):
    pass


class CannotModifySelfError(AuthError):
    """An admin tried to change their own role or active state."""


class CannotDemoteLastAdminError(AuthError):
    """The change would leave the system with no active admin."""
