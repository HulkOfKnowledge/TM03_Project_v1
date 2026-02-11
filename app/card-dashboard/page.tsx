/**
 * Legacy Card Dashboard Redirect
 * Redirects old /card-dashboard route to new /cards route
 */

import { redirect } from 'next/navigation';

export default function LegacyCardDashboard() {
  redirect('/cards');
}
