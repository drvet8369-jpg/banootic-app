import RegisterCustomerForm from './register-customer-form';

export default function RegisterCustomerPage() {
  return (
    <div className="max-w-md mx-auto py-12 md:py-20">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-headline font-bold">ایجاد حساب کاربری</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          برای مشاهده سوابق و چت با ارائه‌دهندگان، ثبت‌نام کنید.
        </p>
      </div>
      <RegisterCustomerForm />
    </div>
  );
}
