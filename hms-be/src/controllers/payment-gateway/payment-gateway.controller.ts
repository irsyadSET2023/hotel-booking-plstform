import type { Context } from "hono";
import { sendError, sendSuccess } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { verifyStripeWebhook } from "../../external-services/payment-gateways/stripe";
import { confirmPaymentService } from "../../services/customer/confirm-payment.customer.service";

export const stripeWebhook = async (c: Context): Promise<Response> => {
  try {
    const rawBody = Buffer.from(await c.req.raw.arrayBuffer());

    console.log("Received Stripe webhook with raw body:", rawBody);

    const signature = c.req.header("stripe-signature") as string;

    const stripeEvent = await verifyStripeWebhook(rawBody, signature);

    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;

        if (session.payment_status === "paid") {
          await confirmPaymentService({
            paymentUuid: session?.metadata?.reference_number as string,
          });
        }

        break;
      }

      case "checkout.session.expired": {
        const session = stripeEvent.data.object;

        await confirmPaymentService({
          paymentUuid: session?.metadata?.reference_number as string,
        });

        break;
      }
    }

    // if (!stripeEvent) {
    //   throw new AppError("Invalid webhook", 400);
    // } else {
    //   await confirmPaymentService({
    //     paymentUuid: session.metadata.reference_number,
    //     isSuccess: true,
    //   });
    // }

    // if (!stripeEvent) {
    //   throw new AppError("Invalid webhook", 400);
    // }

    // switch (stripeEvent.type) {
    //   case "checkout.session.completed": {
    //     const session = stripeEvent.data.object;

    //     if (session.payment_status === "paid") {
    //     }

    //     break;
    //   }

    //   case "checkout.session.expired": {
    //     const session = stripeEvent.data.object;

    //     await confirmPaymentService({
    //       paymentUuid: session.metadata.reference_number,
    //       isSuccess: false,
    //     });

    //     break;
    //   }
    // }

    return sendSuccess(c, null, "Stripe webhook received successfully", 200);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    }

    console.error("Unexpected error in Stripe webhook:", error);
    return sendError(c, "Internal server error", 500);
  }
};
