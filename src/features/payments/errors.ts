/* Words a buyer can act on. Nothing here says what exists or does not exist. */
export const NOT_FOUND_MESSAGE =
  'We could not find an order with those details. If you tried many times, please wait an hour.';

export function paymentErrorMessage(code: string | undefined): string {
  switch (code) {
    case '22023':
      return 'Please check the M-Pesa code. It has 10 letters and numbers, such as SGA4X9K2PQ.';
    case 'SF008':
      return 'This order can no longer take a payment. It may have expired or already been paid. Please contact the shop.';
    case 'SF011':
      return 'That code has already been used. Please check it, or contact the shop.';
    case 'SF012':
      return 'You already sent a code. Please wait while the shop checks it.';
    case 'SF013':
      return 'You have sent the most codes allowed for this order. Please contact the shop.';
    default:
      return 'We could not send your code. Please try again.';
  }
}
