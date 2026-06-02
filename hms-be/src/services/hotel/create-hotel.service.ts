import prisma from "../../config/prisma";
import type { CreateHotelInput } from "./hotel.types";

export const createHotelService = async (data: CreateHotelInput) => {
  await prisma.hotel.create({
    data: {
      name: data.name,
      ...(data.starRating !== undefined && { starRating: data.starRating }),
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
