import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export const listTimezonesService = async (
  countryUuid: string,
  page: number,
  limit: number,
) => {
  const country = await prisma.country.findUnique({
    where: { uuid: countryUuid },
    select: { id: true },
  });

  if (!country) throw new AppError("Country not found", 404);

  const where = { countryId: country.id, isActive: true };

  const [data, total] = await Promise.all([
    prisma.timezone.findMany({
      where,
      select: {
        uuid: true,
        name: true,
        offset: true,
      },
      orderBy: { offset: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.timezone.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
