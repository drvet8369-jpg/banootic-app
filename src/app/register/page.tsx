import { Suspense } from 'react';
import RegisterForm from './register-form';
import { AuthStatusDebugger } from './AuthStatusDebugger';

export default function RegisterPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 md:py-20 flex-grow flex items-center">
      {/* This component will show the live auth status on the screen */}
      <AuthStatusDebugger /> 
      
      <Suspense fallback={
        <div className="w-full text-center">
          در حال بارگذاری فرم ثبت‌نام...
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
