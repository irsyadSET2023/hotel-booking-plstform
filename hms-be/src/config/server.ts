import "dotenv/config";

const serverConfig = {
  port: process.env.APP_PORT || 8080,
  appUrl:
    process.env.APP_URL || `http://localhost:${process.env.APP_PORT || 8080}`,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtSecret:
    process.env.JWT_SECRET ||
    "hms-super-secret-jwt-key-change-in-production-2026",
  sstRate: parseFloat(process.env.SST_RATE || "0.08"), // Default to 8% if not set
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  testDatabaseUrl:
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres:root@localhost/hotel_management_system_test",
};

export default serverConfig;
