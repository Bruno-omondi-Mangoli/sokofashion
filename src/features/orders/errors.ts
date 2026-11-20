/*
 * Turns a database error code into words a buyer can act on. The codes come
 * from place_order. Nothing here says what exists or does not exist.
 */
export function orderErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'SF001':
      return 'One of the items just sold out, or there is less left than you asked for. Please check your cart.';
    case 'SF002':
      return 'One of the items is no longer available. Please check your cart.';
    case 'SF003':
      return 'This shop is not taking orders right now.';
    case 'SF004':
      return 'This shop has too many waiting orders right now. Please try again later.';
    case 'SF005':
      return 'You already have 3 unpaid orders with this shop. Please wait for them to be paid or to expire.';
    case 'SF006':
      return 'This shop does not deliver. Please choose pickup.';
    case '22023':
      return 'Please check your name, phone number and address, then try again.';
    default:
      return 'We could not place your order. Please try again.';
  }
}
