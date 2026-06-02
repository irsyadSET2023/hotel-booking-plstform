import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { RequestingUser } from "./hotel.types";

export const getHotelService = async (
  uuid: string,
  requestingUser: RequestingUser,
) => {
  const hotel = await prisma.hotel.findFirst({
    where: { uuid, deletedAt: null },
    include: {
      addresses: {
        where: { deletedAt: null },
        include: {
          city: { select: { uuid: true, name: true, stateProvince: true } },
          country: {
            select: { uuid: true, name: true, iso2: true, flag: true },
          },
          timezone: { select: { uuid: true, name: true, offset: true } },
        },
      },
    },
  });

  if (!hotel) throw new AppError("Hotel not found", 404);

  // Hotel admin can only view their own hotel
  if (
    requestingUser.role === "HOTEL_ADMIN" &&
    hotel.id.toString() !== requestingUser?.hotelId?.toString()
  ) {
    throw new AppError("Forbidden", 403);
  }

  return hotel;
};
