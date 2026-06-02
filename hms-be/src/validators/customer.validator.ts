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
    companyName: z.string().optional(),
    taxId: z.string().optional(),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    cityId: z.number(),
    countryId: z.number(),
    postalCode: z.string(),
    phoneCountryCodeId: z.string(),
    phoneNumber: z.number().toString(),
  }),

  cartItems: z.array(
    z.object({
      roomCategoryId: z.number(),
      checkInDate: z.string(),
      checkOutDate: z.string(),
      specialRequests: z.string().optional(),
      guestName: z.string().optional(),
      guestEmail: z.string().email().optional(),
    }),
  ),

  currency: z.string().optional(),
});
