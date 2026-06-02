import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export const myProfileService = async (userUuid: string) => {
  const user = await prisma.user.findUnique({
    where: { uuid: userUuid },
    select: {
      uuid: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      hotel: { select: { uuid: true, name: true } },
    },
  });

  if (!user) throw new AppError("User not found", 404);

  return user;
};
