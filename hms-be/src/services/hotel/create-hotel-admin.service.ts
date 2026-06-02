import prisma from "../../config/prisma";
import { hashPassword } from "../../utils/hash";
import { AppError } from "../../utils/app-error";
import type { CreateHotelAdminInput } from "./hotel.types";

export const createHotelAdminService = async (
  hotelUuid: string,
  data: CreateHotelAdminInput,
) => {
  const hotel = await prisma.hotel.findFirst({
    where: { uuid: hotelUuid, deletedAt: null },
  });
  if (!hotel) throw new AppError("Hotel not found", 404);

  const existing = await prisma.user.findFirst({
    where: { email: data.email, deletedAt: null },
  });
  if (existing) throw new AppError("Email is already in use", 409);

  const hashed = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      hotelId: hotel.id,
      email: data.email,
      password: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
      role: "HOTEL_ADMIN",
    },
  });

  return {
    uuid: user.uuid,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    hotel: { uuid: hotel.uuid, name: hotel.name },
  };
};
