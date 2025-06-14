declare module './api' {
  export function initiatePayment(paymentMethodId: string): Promise<any>;
}
