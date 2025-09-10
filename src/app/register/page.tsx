// This page is deprecated. The new authentication flow starts at /auth/register
import { redirect } from 'next/navigation';

export default function RegisterPage() {
  redirect('/auth/register');
}
