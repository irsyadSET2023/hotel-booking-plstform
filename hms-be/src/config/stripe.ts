import "dotenv/config";

const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};

export default stripeConfig;
