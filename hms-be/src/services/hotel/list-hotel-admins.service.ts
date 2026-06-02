import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export const listHotelAdminsService = async (hotelUuid: string) => {
  const hotel = await prisma.hotel.findFirst({
    where: { uuid: hotelUuid, deletedAt: null },
  });
  if (!hotel) throw new AppError("Hotel not found", 404);

  return prisma.user.findMany({
    where: { hotelId: hotel.id, role: "HOTEL_ADMIN", deletedAt: null },
    select: {
      uuid: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};
