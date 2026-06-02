import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export const deleteHotelService = async (uuid: string) => {
  const hotel = await prisma.hotel.findFirst({
    where: { uuid, deletedAt: null },
  });
  if (!hotel) throw new AppError("Hotel not found", 404);

  return prisma.hotel.update({
    where: { id: hotel.id },
    data: { deletedAt: new Date() },
  });
};
