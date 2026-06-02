import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { RequestingUser, UpdateHotelInput } from "./hotel.types";

export const updateHotelService = async (
  uuid: string,
  requestingUser: RequestingUser,
  data: UpdateHotelInput,
) => {
  const hotel = await prisma.hotel.findFirst({
    where: { uuid, deletedAt: null },
  });
  if (!hotel) throw new AppError("Hotel not found", 404);

  // Hotel admin can only update their own hotel
  if (
    requestingUser.role === "HOTEL_ADMIN" &&
    hotel.id.toString() !== requestingUser.hotelId
  ) {
    throw new AppError("Forbidden", 403);
  }

  await prisma.hotel.update({
    where: { id: hotel.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.starRating !== undefined && { starRating: data.starRating }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      addresses: {
        where: { isPrimary: true, deletedAt: null },
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
};
