/**
 * Legacy Learn Dashboard Redirect
 * Redirects old /learn-dashboard route to new /learn route
 */

import { redirect } from 'next/navigation';

export default function LegacyLearnDashboard() {
  redirect('/learn');
}
