// This page is deprecated. The new authentication flow starts at /auth/login
import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/auth/login');
}
