import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z.email(),
});

export const verifyOtpSchema = z.object({
  email: z.email(),
  code: z.string().min(4).max(8),
});

export const checkCustomerEmailSchema = z.object({
  email: z.email(),
});

export const checkoutCartSchema = z.object({
  email: z.email(),
  billingDetails: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    cityUuid: z.string(),
    countryUuid: z.string(),
    postalCode: z.string(),
    phoneCountryCodeUuid: z.string(),
    phoneNumber: z.string().min(7).max(15),
  }),

  cartItems: z.array(
    z.object({
      roomCategoryUuid: z.string(),
      checkInDate: z.string(),
      checkOutDate: z.string(),
      specialRequests: z.string().optional(),
      guestName: z.string(),
      guestEmail: z.email(),
    }),
  ),

  currency: z.string().optional(),
});
