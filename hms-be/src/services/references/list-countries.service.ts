import prisma from "../../config/prisma";

export const listCountriesService = async (
  page: number,
  limit: number,
  search?: string,
) => {
  const where = search
    ? {
        isActive: true,
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { iso2: { contains: search, mode: "insensitive" as const } },
          { iso3: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : { isActive: true };

  const [data, total] = await Promise.all([
    prisma.country.findMany({
      where,
      select: {
        uuid: true,
        name: true,
        iso2: true,
        iso3: true,
        phoneCode: true,
        currency: true,
        flag: true,
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.country.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
