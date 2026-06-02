import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export const checkCustomerEmailService = async (email: string) => {
  const customer = await prisma.customer.findUnique({
    where: { email },
  });

  return {
    isVerified: customer ? customer.emailVerified : false,
  };
};
