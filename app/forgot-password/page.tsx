import { PasswordRecoveryForm } from "@/components/PasswordRecoveryForm";

export const metadata = { title: "Восстановление доступа" };

export default function ForgotPasswordPage() {
  return (
    <div className="container-page min-h-[75vh]">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Восстановление доступа</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Забыли пароль или логин?</h1>
          <p className="mt-3 text-slate-500">
            Введите номер телефона. Он является вашим логином, а код подтверждения позволит создать новый пароль.
          </p>
        </div>
        <PasswordRecoveryForm />
      </div>
    </div>
  );
}
