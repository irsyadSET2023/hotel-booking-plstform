import type { UserRole } from "../../../generated/prisma/index.js";

export interface RequestingUser {
  role: UserRole;
  hotelId: string | null;
}

export interface CreateHotelInput {
  name: string;
  starRating?: number;
}

export interface UpdateHotelInput {
  name?: string;
  starRating?: number;
  isActive?: boolean;
}

export interface CreateHotelAdminInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
