export interface SystemSettings {
  passwordRequiredLength: number;
  passwordMaxLength: number;
  passwordRequireDigit: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireUppercase: boolean;
  passwordRequireNonAlphanumeric: boolean;
  lockoutMaxFailedAttempts: number;
  lockoutDurationMinutes: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUserName?: string;
  smtpEnableSsl: boolean;
  smtpSenderAddress?: string;
  smtpSenderDisplayName?: string;
  hasSmtpPassword: boolean;
  homepageTitle?: string;
  homepageDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  issuingAgency?: string;
  hasLogo: boolean;
  hasLoginBackground: boolean;
  licenseExpiryNotificationDays: number;
  minioEndpoint?: string;
  minioBucketName?: string;
}

export interface UpdateSystemSettingsInput extends Omit<
  SystemSettings,
  | "hasSmtpPassword"
  | "hasLogo"
  | "hasLoginBackground"
  | "minioEndpoint"
  | "minioBucketName"
> {
  smtpPassword?: string;
}

export type BrandingImageKind = "logo" | "login-background";
