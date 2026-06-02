import Stripe from "stripe";
import stripeConfig from "../../config/stripe";
import type {
  PaymentStatus,
  StripePaymentRequestDetails,
} from "../../interfaces";
import { AppError } from "../../utils/app-error";

const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: "2026-05-27.dahlia", // Use the latest API version
});

export async function createStripePaymentRequest(
  paymentRequestDetails: StripePaymentRequestDetails,
) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: paymentRequestDetails.currency,
          product_data: {
            name: paymentRequestDetails.description,
          },
          unit_amount: paymentRequestDetails.amount * 100, // Stripe uses cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: paymentRequestDetails.successUrl,
    cancel_url: paymentRequestDetails.cancelUrl,
    customer_email: paymentRequestDetails.email,
    metadata: {
      reference_number: paymentRequestDetails.reference_number,
    },
  });

  if (!session) {
    throw new AppError("Failed to create Stripe payment session", 500);
  }
  return session;
}

export async function getStripePaymentStatus(
  stripeSessionId: string,
): Promise<PaymentStatus> {
  const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

  if (!session) {
    throw new AppError("Stripe session not found", 400);
  }
  return {
    status: session.payment_status,
    description: session.metadata?.description || "",
    amount: (session.amount_total! / 100).toString(), // Convert back from cents
    reference_number: session.metadata?.reference_number || "",
  };
}

export async function getStripePaymentStatusThankYouPage(
  stripeSessionId: string,
): Promise<PaymentStatus> {
  const retryCount = 3;

  for (let i = 0; i < retryCount; i++) {
    try {
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      const result = {
        status: session.payment_status,
        description: session.metadata?.description || "",
        amount: (session.amount_total! / 100).toString(),
        reference_number: session.metadata?.reference_number || "",
      };

      // if (result.status === 'paid') {
      //   await confirmPaymentService({
      //     purpose: 'payment',
      //     amount: result.amount,
      //     reference_number: result.reference_number,
      //   });
      // }

      console.log(
        "In payment status thank you page, Payment status:",
        result.status,
      );

      if (result.status !== "unpaid") {
        return result;
      }

      // Wait 1 second before next retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error getting Stripe payment status:", error);
      throw error;
    }
  }

  // Final attempt if all retries were pending
  return await getStripePaymentStatus(stripeSessionId);
}

export async function verifyStripeWebhook(payload: Buffer, signature: string) {
  return await stripe.webhooks.constructEventAsync(
    payload,
    signature,
    stripeConfig.webhookSecret,
  );
}

export async function cancelStripePayment(sessionId: string): Promise<boolean> {
  const session = await stripe.checkout.sessions.expire(sessionId);

  if (session) {
    return true;
  } else {
    return false;
  }
}
