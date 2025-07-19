import RegisterForm from './register-form';

export default function RegisterPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 md:py-20">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-headline font-bold">به جامعه ما بپیوندید</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          به‌عنوان ارائه‌دهنده خدمات ثبت‌نام کنید و به مشتریان جدیدی در منطقه خود دسترسی پیدا کنید.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
