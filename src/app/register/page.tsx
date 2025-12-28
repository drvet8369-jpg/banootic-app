// This page is no longer in use. The registration flow
// has been merged into the /login/verify page.
// This file can be safely deleted.
import { redirect } from 'next/navigation';

export default function RegisterPage() {
  redirect('/login');
}
