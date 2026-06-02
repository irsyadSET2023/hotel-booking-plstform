import { z } from "zod";

export const listRoomsQuerySchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),

    hotelUuid: z.string().optional(),
    roomCategoryId: z.coerce.number().optional(),

    status: z
      .enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "OUT_OF_SERVICE"])
      .optional(),

    checkInDate: z.coerce.date().optional(),
    checkOutDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      // both or none rule
      const hasCheckIn = !!data.checkInDate;
      const hasCheckOut = !!data.checkOutDate;

      return (hasCheckIn && hasCheckOut) || (!hasCheckIn && !hasCheckOut);
    },
    {
      message: "Both checkInDate and checkOutDate must be provided together",
    },
  );

export const listRoomCategoriesQuerySchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),

    hotelUuid: z.string().optional(),

    checkInDate: z.coerce.date(),
    checkOutDate: z.coerce.date(),
  })
  .refine(
    (data) => {
      if (data.checkInDate && data.checkOutDate) return true;
      if (!data.checkInDate && !data.checkOutDate) return true;
      return false;
    },
    {
      message: "Both checkInDate and checkOutDate must be provided together",
    },
  )
  .refine(
    (data) => {
      if (!data.checkInDate || !data.checkOutDate) return true;
      return new Date(data.checkInDate) < new Date(data.checkOutDate);
    },
    {
      message: "checkInDate must be before checkOutDate",
    },
  );
