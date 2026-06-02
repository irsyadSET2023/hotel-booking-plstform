export interface StripePaymentRequestDetails {
  amount: number;
  currency: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  description: string;
  reference_number: string;
}

export interface PaymentStatus {
  status: string;
  description: string;
  amount: string;
  reference_number: string;
}

export interface CheckoutCartRequest {
  billingAddress: BillingAddress;
  cartRoomCategories: CartRoomCategory[];
}

export interface CartRoomCategory {
  roomCategoryUuid: string;

  checkInDate: string;
  checkOutDate: string;

  guestName?: string;
  guestEmail?: string;

  specialRequests?: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  companyName?: string;
  taxId?: string;

  addressLine1: string;
  addressLine2?: string;

  cityUuid: string;
  countryUuid: string;

  stateProvince?: string;
  postalCode?: string;

  email: string;

  phoneCountryUuid?: string;
  phoneNumber?: string;
}
