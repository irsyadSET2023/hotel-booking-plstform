import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export const listCitiesService = async (
  countryUuid: string,
  page: number,
  limit: number,
  search?: string,
) => {
  const country = await prisma.country.findUnique({
    where: { uuid: countryUuid },
    select: { id: true },
  });

  if (!country) throw new AppError("Country not found", 404);

  const where = {
    countryId: country.id,
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { stateProvince: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.city.findMany({
      where,
      select: {
        uuid: true,
        name: true,
        stateProvince: true,
      },
      orderBy: [{ stateProvince: "asc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.city.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
