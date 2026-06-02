import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  checkCustomerEmailSchema,
  checkoutCartSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../validators/customer.validator";
import {
  checkoutCart,
  checkCustomerEmail,
  sendOtp,
  verifyOtp,
} from "../controllers/customer/customer.controller";

const customerRouter = new Hono();

// OTP routes
customerRouter.post(
  "/check-email",
  zValidator("json", checkCustomerEmailSchema),
  checkCustomerEmail,
);
customerRouter.post(
  "/checkout/cart",
  zValidator("json", checkoutCartSchema),
  checkoutCart,
);

customerRouter.post("/otp/send", zValidator("json", sendOtpSchema), sendOtp);
customerRouter.post(
  "/otp/verify",
  zValidator("json", verifyOtpSchema),
  verifyOtp,
);

export default customerRouter;
