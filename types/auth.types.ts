export interface AuthUserMetadata {
  full_name: string | null;
  name: string | null;
  first_name: string | null;
  surname: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
  picture: string | null;
  preferred_language: string | null;
}

export interface AuthUser {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  user_metadata: AuthUserMetadata;
}

export interface AuthProfile {
  onboarding_completed: boolean;
  preferred_dashboard: 'learn' | 'card' | null;
  first_name: string | null;
  surname: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
  onboarding_stage: string | null;
  onboarding_substep: string | null;
  onboarding_data: unknown;
}
