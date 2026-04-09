import { loadEnvConfig } from '@next/env';
import { createAdminClient } from '../lib/supabase/admin';

type DemoUser = {
  firstName: string;
  lastName: string;
  gender: 'female' | 'male';
  email: string;
  passwordEnvVar: 'KRISTI_DEMO_PASSWORD' | 'MARCUS_DEMO_PASSWORD';
  mobileNumber: string;
  preferredDashboard: 'learn' | 'card';
  avatarUrl: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    firstName: 'Kristi',
    lastName: 'Mumbi',
    gender: 'female',
    email: 'kristi.mumbi.demo@creduman.app',
    passwordEnvVar: 'KRISTI_DEMO_PASSWORD',
    mobileNumber: '+15145551001',
    preferredDashboard: 'learn',
    avatarUrl: '/avatars/kristi.svg',
  },
  {
    firstName: 'Marcus',
    lastName: 'Thomas',
    gender: 'male',
    email: 'marcus.thomas.demo@creduman.app',
    passwordEnvVar: 'MARCUS_DEMO_PASSWORD',
    mobileNumber: '+15145551002',
    preferredDashboard: 'card',
    avatarUrl: '/avatars/marcus.svg',
  },
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function findUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  let page = 1;
  const perPage = 100;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      return found;
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

async function ensureDemoUser(admin: ReturnType<typeof createAdminClient>, user: DemoUser) {
  const password = requireEnv(user.passwordEnvVar);
  let authUser = await findUserByEmail(admin, user.email);

  if (!authUser) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: user.firstName,
        surname: user.lastName,
        mobile_number: user.mobileNumber,
        gender: user.gender,
        avatar_url: user.avatarUrl,
      },
    });

    if (error || !data.user) {
      throw new Error(`Failed to create ${user.email}: ${error?.message || 'Unknown error'}`);
    }

    authUser = data.user;
    console.log(`Created auth user: ${user.email}`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(authUser.id, {
      password,
      user_metadata: {
        first_name: user.firstName,
        surname: user.lastName,
        mobile_number: user.mobileNumber,
        gender: user.gender,
        avatar_url: user.avatarUrl,
      },
    });

    if (error) {
      throw new Error(`Failed to update ${user.email}: ${error.message}`);
    }

    console.log(`Updated auth user: ${user.email}`);
  }

  const { error: profileError } = await admin
    .from('user_profiles')
    .upsert(
      {
        id: authUser.id,
        email: user.email,
        first_name: user.firstName,
        surname: user.lastName,
        mobile_number: user.mobileNumber,
        avatar_url: user.avatarUrl,
        preferred_language: 'en',
        onboarding_completed: true,
        preferred_dashboard: user.preferredDashboard,
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    throw new Error(`Failed to upsert profile for ${user.email}: ${profileError.message}`);
  }

  return {
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    passwordEnvVar: user.passwordEnvVar,
  };
}

async function main() {
  loadEnvConfig(process.cwd());
  const admin = createAdminClient();
  const seeded = [] as Array<{ name: string; email: string; passwordEnvVar: string }>;

  for (const user of DEMO_USERS) {
    const result = await ensureDemoUser(admin, user);
    seeded.push(result);
  }

  console.log('');
  console.log('Demo users ready:');
  for (const user of seeded) {
    console.log(`- ${user.name}: ${user.email} (password from ${user.passwordEnvVar})`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error while seeding demo users';
  console.error(message);
  process.exit(1);
});
