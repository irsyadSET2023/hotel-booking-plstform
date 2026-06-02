import type { PrismaClient } from "../../generated/prisma/index.js";

// ─── Reference data ───────────────────────────────────────────────────────────

const COUNTRIES = [
  {
    name: "Malaysia",
    iso2: "MY",
    iso3: "MYS",
    phoneCode: "+60",
    currency: "MYR",
    flag: "🇲🇾",
    cities: [
      { name: "Kuala Lumpur", stateProvince: "Kuala Lumpur" },
      { name: "George Town", stateProvince: "Penang" },
      { name: "Johor Bahru", stateProvince: "Johor" },
      { name: "Kota Kinabalu", stateProvince: "Sabah" },
      { name: "Kuching", stateProvince: "Sarawak" },
      { name: "Ipoh", stateProvince: "Perak" },
      { name: "Shah Alam", stateProvince: "Selangor" },
      { name: "Malacca City", stateProvince: "Malacca" },
    ],
    timezones: [
      { name: "Asia/Kuala_Lumpur", offset: "+08:00" },
      { name: "Asia/Kuching", offset: "+08:00" },
    ],
  },
  {
    name: "Indonesia",
    iso2: "ID",
    iso3: "IDN",
    phoneCode: "+62",
    currency: "IDR",
    flag: "🇮🇩",
    cities: [
      { name: "Jakarta", stateProvince: "DKI Jakarta" },
      { name: "Surabaya", stateProvince: "East Java" },
      { name: "Bandung", stateProvince: "West Java" },
      { name: "Bali", stateProvince: "Bali" },
      { name: "Yogyakarta", stateProvince: "Special Region of Yogyakarta" },
      { name: "Medan", stateProvince: "North Sumatra" },
      { name: "Makassar", stateProvince: "South Sulawesi" },
      { name: "Semarang", stateProvince: "Central Java" },
    ],
    timezones: [
      { name: "Asia/Jakarta", offset: "+07:00" },
      { name: "Asia/Makassar", offset: "+08:00" },
      { name: "Asia/Jayapura", offset: "+09:00" },
    ],
  },
  {
    name: "Singapore",
    iso2: "SG",
    iso3: "SGP",
    phoneCode: "+65",
    currency: "SGD",
    flag: "🇸🇬",
    cities: [
      { name: "Singapore", stateProvince: "Central Region" },
      { name: "Jurong East", stateProvince: "West Region" },
      { name: "Tampines", stateProvince: "East Region" },
      { name: "Woodlands", stateProvince: "North Region" },
    ],
    timezones: [{ name: "Asia/Singapore", offset: "+08:00" }],
  },
  {
    name: "Thailand",
    iso2: "TH",
    iso3: "THA",
    phoneCode: "+66",
    currency: "THB",
    flag: "🇹🇭",
    cities: [
      { name: "Bangkok", stateProvince: "Bangkok" },
      { name: "Chiang Mai", stateProvince: "Chiang Mai" },
      { name: "Phuket", stateProvince: "Phuket" },
      { name: "Pattaya", stateProvince: "Chonburi" },
      { name: "Hua Hin", stateProvince: "Prachuap Khiri Khan" },
    ],
    timezones: [{ name: "Asia/Bangkok", offset: "+07:00" }],
  },
  {
    name: "Japan",
    iso2: "JP",
    iso3: "JPN",
    phoneCode: "+81",
    currency: "JPY",
    flag: "🇯🇵",
    cities: [
      { name: "Tokyo", stateProvince: "Tokyo" },
      { name: "Osaka", stateProvince: "Osaka" },
      { name: "Kyoto", stateProvince: "Kyoto" },
      { name: "Sapporo", stateProvince: "Hokkaido" },
      { name: "Fukuoka", stateProvince: "Fukuoka" },
      { name: "Hiroshima", stateProvince: "Hiroshima" },
    ],
    timezones: [{ name: "Asia/Tokyo", offset: "+09:00" }],
  },
  {
    name: "Australia",
    iso2: "AU",
    iso3: "AUS",
    phoneCode: "+61",
    currency: "AUD",
    flag: "🇦🇺",
    cities: [
      { name: "Sydney", stateProvince: "New South Wales" },
      { name: "Melbourne", stateProvince: "Victoria" },
      { name: "Brisbane", stateProvince: "Queensland" },
      { name: "Perth", stateProvince: "Western Australia" },
      { name: "Adelaide", stateProvince: "South Australia" },
    ],
    timezones: [
      { name: "Australia/Sydney", offset: "+10:00" },
      { name: "Australia/Melbourne", offset: "+10:00" },
      { name: "Australia/Brisbane", offset: "+10:00" },
      { name: "Australia/Perth", offset: "+08:00" },
      { name: "Australia/Adelaide", offset: "+09:30" },
      { name: "Australia/Darwin", offset: "+09:30" },
    ],
  },
  {
    name: "United Kingdom",
    iso2: "GB",
    iso3: "GBR",
    phoneCode: "+44",
    currency: "GBP",
    flag: "🇬🇧",
    cities: [
      { name: "London", stateProvince: "England" },
      { name: "Manchester", stateProvince: "England" },
      { name: "Birmingham", stateProvince: "England" },
      { name: "Edinburgh", stateProvince: "Scotland" },
      { name: "Cardiff", stateProvince: "Wales" },
    ],
    timezones: [{ name: "Europe/London", offset: "+00:00" }],
  },
  {
    name: "United States",
    iso2: "US",
    iso3: "USA",
    phoneCode: "+1",
    currency: "USD",
    flag: "🇺🇸",
    cities: [
      { name: "New York", stateProvince: "New York" },
      { name: "Los Angeles", stateProvince: "California" },
      { name: "Chicago", stateProvince: "Illinois" },
      { name: "Houston", stateProvince: "Texas" },
      { name: "Las Vegas", stateProvince: "Nevada" },
      { name: "Miami", stateProvince: "Florida" },
      { name: "San Francisco", stateProvince: "California" },
    ],
    timezones: [
      { name: "America/New_York", offset: "-05:00" },
      { name: "America/Chicago", offset: "-06:00" },
      { name: "America/Denver", offset: "-07:00" },
      { name: "America/Los_Angeles", offset: "-08:00" },
      { name: "America/Anchorage", offset: "-09:00" },
      { name: "Pacific/Honolulu", offset: "-10:00" },
    ],
  },
];

export async function seedReferences(prisma: PrismaClient): Promise<void> {
  console.log("📍 Seeding reference data (countries, cities, timezones)...\n");

  for (const countryData of COUNTRIES) {
    const { cities, timezones, ...countryFields } = countryData;

    const country = await prisma.country.upsert({
      where: { iso2: countryFields.iso2 },
      update: {},
      create: countryFields,
    });

    for (const city of cities) {
      const existing = await prisma.city.findFirst({
        where: { countryId: country.id, name: city.name },
        select: { id: true },
      });
      if (!existing) {
        await prisma.city.create({ data: { ...city, countryId: country.id } });
      }
    }

    for (const tz of timezones) {
      await prisma.timezone.upsert({
        where: { name: tz.name },
        update: {},
        create: { ...tz, countryId: country.id },
      });
    }

    console.log(
      `  ✓  ${country.name} — ${cities.length} cities, ${timezones.length} timezones`,
    );
  }

  console.log();
}
