import prisma from "../../config/prisma";
import { comparePassword } from "../../utils/hash";
import { signToken } from "../../utils/jwt";
import { AppError } from "../../utils/app-error";

export const loginService = async (email: string, password: string) => {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: {
      hotel: { select: { uuid: true, name: true } },
    },
  });

  // Use a generic message to prevent user enumeration
  if (!user) throw new AppError("Invalid email or password", 401);

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

  if (!user.isActive)
    throw new AppError("Your account has been deactivated", 403);

  // Update last login timestamp (fire-and-forget)
  prisma.user
    .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    .catch(() => {
      /* non-critical */
    });

  const token = signToken({ uuid: user.uuid });

  return { token };
};
