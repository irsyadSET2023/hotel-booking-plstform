import prisma from "../../config/prisma";

export const listHotelsService = async (
  page: number,
  limit: number,
  search?: string,
) => {
  const skip = (page - 1) * limit;
  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [hotels, total] = await prisma.$transaction([
    prisma.hotel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        uuid: true,
        name: true,
        starRating: true,
        isActive: true,
        createdAt: true,
        addresses: {
          where: { isPrimary: true, deletedAt: null },
          select: {
            uuid: true,
            addressLine1: true,
            postalCode: true,
            city: { select: { uuid: true, name: true, stateProvince: true } },
            country: {
              select: { uuid: true, name: true, iso2: true, flag: true },
            },
            timezone: { select: { uuid: true, name: true, offset: true } },
          },
        },
      },
    }),
    prisma.hotel.count({ where }),
  ]);

  return {
    data: hotels,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
