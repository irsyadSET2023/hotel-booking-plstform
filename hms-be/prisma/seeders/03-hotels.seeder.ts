import type { PrismaClient } from "../../generated/prisma/index.js";
import { hashPassword } from "../../src/utils/hash";

// ─── Hotel seed data ──────────────────────────────────────────────────────────

interface HotelSeedData {
  name: string;
  countryIso2: string;
  cityName: string;
  timezoneName: string;
  starRating: number;
  address: {
    addressLine1: string;
    postalCode?: string;
    email?: string;
    phone?: string;
  };
  admin: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  };
}

const HOTELS: HotelSeedData[] = [
  // ─── Malaysia (3 — compulsory) ─────────────────────────────────────────────
  {
    name: "Grand Palace Hotel",
    countryIso2: "MY",
    cityName: "Kuala Lumpur",
    timezoneName: "Asia/Kuala_Lumpur",
    starRating: 5,
    address: {
      addressLine1: "No. 8, Jalan Bukit Bintang, Bukit Bintang",
      postalCode: "55100",
    },
    admin: {
      email: "admin@grandpalace.hms.com",
      firstName: "Amir",
      lastName: "Hassan",
      password: "HotelAdmin@123",
    },
  },
  {
    name: "Penang Heritage Boutique Hotel",
    countryIso2: "MY",
    cityName: "George Town",
    timezoneName: "Asia/Kuala_Lumpur",
    starRating: 4,
    address: {
      addressLine1: "1 Lebuh Farquhar, Georgetown",
      postalCode: "10200",
    },
    admin: {
      email: "admin@penangheritage.hms.com",
      firstName: "Lim",
      lastName: "Wei Jing",
      password: "HotelAdmin@123",
    },
  },
  {
    name: "Borneo Rainforest Resort",
    countryIso2: "MY",
    cityName: "Kota Kinabalu",
    timezoneName: "Asia/Kuching",
    starRating: 4,
    address: {
      addressLine1: "1 Jalan Gaya, Pusat Bandar",
      postalCode: "88000",
    },
    admin: {
      email: "admin@borneoresort.hms.com",
      firstName: "Rajesh",
      lastName: "Kumar",
      password: "HotelAdmin@123",
    },
  },

  // ─── Indonesia ─────────────────────────────────────────────────────────────
  {
    name: "Bali Sunset Villas",
    countryIso2: "ID",
    cityName: "Bali",
    timezoneName: "Asia/Makassar",
    starRating: 5,
    address: {
      addressLine1: "Jl. Pantai Kuta No. 1, Kuta",
      postalCode: "80361",
    },
    admin: {
      email: "admin@balisunset.hms.com",
      firstName: "Putu",
      lastName: "Wijaya",
      password: "HotelAdmin@123",
    },
  },

  // ─── Singapore ─────────────────────────────────────────────────────────────
  {
    name: "Marina Bay Residences",
    countryIso2: "SG",
    cityName: "Singapore",
    timezoneName: "Asia/Singapore",
    starRating: 5,
    address: {
      addressLine1: "10 Bayfront Avenue",
      postalCode: "018956",
    },
    admin: {
      email: "admin@marinabay.hms.com",
      firstName: "Grace",
      lastName: "Tan",
      password: "HotelAdmin@123",
    },
  },

  // ─── Thailand ──────────────────────────────────────────────────────────────
  {
    name: "Bangkok Royal Garden Hotel",
    countryIso2: "TH",
    cityName: "Bangkok",
    timezoneName: "Asia/Bangkok",
    starRating: 4,
    address: {
      addressLine1: "1 Thanon Ratchadamnoen Nok, Phra Nakhon",
      postalCode: "10200",
    },
    admin: {
      email: "admin@bangkokroyal.hms.com",
      firstName: "Somchai",
      lastName: "Charoenwong",
      password: "HotelAdmin@123",
    },
  },

  // ─── Japan ─────────────────────────────────────────────────────────────────
  {
    name: "Tokyo Imperial Grand Hotel",
    countryIso2: "JP",
    cityName: "Tokyo",
    timezoneName: "Asia/Tokyo",
    starRating: 5,
    address: {
      addressLine1: "1-1-1 Uchisaiwaicho, Chiyoda",
      postalCode: "100-0011",
    },
    admin: {
      email: "admin@tokyoimperial.hms.com",
      firstName: "Kenji",
      lastName: "Yamamoto",
      password: "HotelAdmin@123",
    },
  },

  // ─── Australia ─────────────────────────────────────────────────────────────
  {
    name: "Sydney Harbour View Hotel",
    countryIso2: "AU",
    cityName: "Sydney",
    timezoneName: "Australia/Sydney",
    starRating: 4,
    address: {
      addressLine1: "176 Cumberland Street, The Rocks",
      postalCode: "2000",
    },
    admin: {
      email: "admin@sydneyharbour.hms.com",
      firstName: "Sarah",
      lastName: "Mitchell",
      password: "HotelAdmin@123",
    },
  },

  // ─── United Kingdom ────────────────────────────────────────────────────────
  {
    name: "London Grand Kensington",
    countryIso2: "GB",
    cityName: "London",
    timezoneName: "Europe/London",
    starRating: 5,
    address: {
      addressLine1: "109-113 Queen's Gate, South Kensington",
      postalCode: "SW7 5LP",
    },
    admin: {
      email: "admin@londongrand.hms.com",
      firstName: "Oliver",
      lastName: "Blackwood",
      password: "HotelAdmin@123",
    },
  },

  // ─── United States ─────────────────────────────────────────────────────────
  {
    name: "New York Skyline Suites",
    countryIso2: "US",
    cityName: "New York",
    timezoneName: "America/New_York",
    starRating: 5,
    address: {
      addressLine1: "768 Fifth Avenue, Midtown Manhattan",
      postalCode: "10019",
    },
    admin: {
      email: "admin@nyskyline.hms.com",
      firstName: "Jessica",
      lastName: "Hartman",
      password: "HotelAdmin@123",
    },
  },
];

// ─── Seeder ───────────────────────────────────────────────────────────────────

export async function seedHotels(prisma: PrismaClient): Promise<void> {
  console.log("🏨 Seeding hotels...\n");

  for (const hotelData of HOTELS) {
    // Look up country
    const country = await prisma.country.findFirst({
      where: { iso2: hotelData.countryIso2 },
    });
    if (!country) {
      console.warn(
        `  ⚠  Country "${hotelData.countryIso2}" not found, skipping ${hotelData.name}`,
      );
      continue;
    }

    // Look up city
    const city = await prisma.city.findFirst({
      where: { name: hotelData.cityName, countryId: country.id },
    });
    if (!city) {
      console.warn(
        `  ⚠  City "${hotelData.cityName}" not found, skipping ${hotelData.name}`,
      );
      continue;
    }

    // Look up timezone
    const timezone = await prisma.timezone.findFirst({
      where: { name: hotelData.timezoneName },
    });
    if (!timezone) {
      console.warn(
        `  ⚠  Timezone "${hotelData.timezoneName}" not found, skipping ${hotelData.name}`,
      );
      continue;
    }

    // Check if hotel already exists
    const existingHotel = await prisma.hotel.findFirst({
      where: { name: hotelData.name, deletedAt: null },
    });
    if (existingHotel) {
      console.log(`  –  ${hotelData.name} already exists`);
      continue;
    }

    // Create hotel
    const hotel = await prisma.hotel.create({
      data: {
        name: hotelData.name,
        starRating: hotelData.starRating,
      },
    });

    // Create primary address (country, city, timezone live here)
    await prisma.address.create({
      data: {
        hotelId: hotel.id,
        addressLine1: hotelData.address.addressLine1,
        cityId: city.id,
        countryId: country.id,
        timezoneId: timezone.id,
        stateProvince: city.stateProvince ?? undefined,
        postalCode: hotelData.address.postalCode,
        isPrimary: true,
      },
    });

    // Create hotel admin
    const existingAdmin = await prisma.user.findFirst({
      where: { email: hotelData.admin.email, deletedAt: null },
    });
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          hotelId: hotel.id,
          email: hotelData.admin.email,
          password: await hashPassword(hotelData.admin.password),
          firstName: hotelData.admin.firstName,
          lastName: hotelData.admin.lastName,
          role: "HOTEL_ADMIN",
        },
      });
    }

    console.log(
      `  ✓  ${hotelData.name} (${country.flag ?? hotelData.countryIso2}) — ${hotelData.starRating}⭐`,
    );
    console.log(`     Address: ${hotelData.address.addressLine1}`);
    console.log(
      `     Admin:   ${hotelData.admin.email} / ${hotelData.admin.password}`,
    );
  }

  console.log();
}
