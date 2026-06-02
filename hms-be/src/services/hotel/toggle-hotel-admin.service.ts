import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export const toggleHotelAdminService = async (
  hotelUuid: string,
  adminUuid: string,
  isActive: boolean,
) => {
  const hotel = await prisma.hotel.findFirst({
    where: { uuid: hotelUuid, deletedAt: null },
  });
  if (!hotel) throw new AppError("Hotel not found", 404);

  const admin = await prisma.user.findFirst({
    where: {
      uuid: adminUuid,
      hotelId: hotel.id,
      role: "HOTEL_ADMIN",
      deletedAt: null,
    },
  });
  if (!admin) throw new AppError("Hotel admin not found", 404);

  return prisma.user.update({
    where: { id: admin.id },
    data: { isActive },
    select: {
      uuid: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });
};
