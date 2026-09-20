export async function sendPasswordResetCode(phone: string, code: string): Promise<void> {
  // Локальный режим: настоящий SMS-провайдер пока не подключён.
  // При переносе сайта в интернет эта функция заменяется вызовом SMS-сервиса.
  console.log(`[ПЕРСПЕКТИВА SMS TEST] Код восстановления для ${phone}: ${code}`);
}
