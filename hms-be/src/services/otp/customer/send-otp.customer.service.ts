import prisma from "../../../config/prisma";
import { sendEmail } from "../../../external-services/email-service";

enum OTP_TYPE {
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
}

export const sendOtpService = async (email: string) => {
  let customer = await prisma.customer.findUnique({
    where: { email },
  });

  if (!customer) {
    const newCustomer = await prisma.customer.create({
      data: { email },
    });
    customer = newCustomer;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  await prisma.otp.create({
    data: {
      customerId: customer.id,
      type: OTP_TYPE.EMAIL_VERIFICATION,
      code,
      expiresAt,
    },
  });

  await sendEmail({
    to: [email],
    subject: "Your OTP Code",
    html: `<p>Your OTP code is: <strong>${code}</strong>. It will expire in 10 minutes.</p>`,
  });
};
