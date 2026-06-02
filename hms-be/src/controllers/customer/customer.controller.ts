import type { Context } from "hono";
import { sendSuccess, sendError } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { sendOtpService } from "../../services/otp/customer/send-otp.customer.service";
import { verifyOtpService } from "../../services/otp/customer/verify-otp.customer.service";
import { checkCustomerEmailService } from "../../services/customer/check-customer-email.customer.service";
import { checkoutCartService } from "../../services/customer/checkout-cart.customer.service";
import type { checkoutCartSchema } from "../../validators/customer.validator";
import { z } from "zod";
export const sendOtp = async (c: Context) => {
  try {
    const { email } = (
      c.req as {
        valid: (type: string) => { email: string };
      }
    ).valid("json");

    const result = await sendOtpService(email);

    return sendSuccess(c, result, "OTP sent");
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(c, err.message, err.statusCode);
    }
    return sendError(c, "Internal server error", 500);
  }
};

export const verifyOtp = async (c: Context) => {
  try {
    const { email, code } = (
      c.req as {
        valid: (type: string) => { email: string; code: string };
      }
    ).valid("json");

    const result = await verifyOtpService(email, code);

    return sendSuccess(c, result, "Email verified");
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(c, err.message, err.statusCode);
    }
    return sendError(c, "Internal server error", 500);
  }
};

export const checkCustomerEmail = async (c: Context) => {
  try {
    const { email } = (
      c.req as {
        valid: (type: string) => { email: string };
      }
    ).valid("json");
    const result = await checkCustomerEmailService(email);

    return sendSuccess(c, result, "Email check successful");
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(c, err.message, err.statusCode);
    }
    console.error(err);
    return sendError(c, "Internal server error", 500);
  }
};

export const checkoutCart = async (c: Context) => {
  try {
    type CheckoutCartPayload = z.infer<typeof checkoutCartSchema>;

    const payload = (await c.req.json()) as CheckoutCartPayload;

    const result = await checkoutCartService(payload);

    return sendSuccess(c, result, "Checkout initiated");
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(c, err.message, err.statusCode);
    }

    console.error(err);
    return sendError(c, "Internal server error", 500);
  }
};
