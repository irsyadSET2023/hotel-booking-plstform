import prisma from "../../../config/prisma";
import { AppError } from "../../../utils/app-error";

enum OTP_TYPE {
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
}

export const verifyOtpService = async (email: string, code: string) => {
  const customer = await prisma.customer.findUnique({
    where: { email },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const otp = await prisma.otp.findFirst({
    where: {
      customerId: customer.id,
      type: OTP_TYPE.EMAIL_VERIFICATION,
      code,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otp) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      emailVerified: true,
    },
  });
};
