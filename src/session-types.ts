export enum G4UserStatus {
  Pending = 0,
  Active = 1,
  Inactive = 2,
  Reset = 3,
  Validating = 4,
  Anonymous = 5,
}

export enum G4UserEventType {
  UserAuthenticated = 0,
  UserAuthenticationFailure = 1,
  UserClaimTokens = 2,
  UserResetTokens = 3,
  UserClaimTokenVerification = 4,
  UserResetTokenVerification = 5,

  AdminCreated = 1000,
  UserCreated = 1001,
  UserImported = 1002,
  UserUpdated = 1003,
  PasswordChanged = 1004,
  UserArchived = 1005,
}
