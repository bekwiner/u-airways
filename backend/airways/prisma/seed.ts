import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create countries
  const uzbekistan = await prisma.country.upsert({
    where: { code: 'UZ' },
    update: {},
    create: {
      name: 'Uzbekistan',
      code: 'UZ',
      currency: 'UZS',
    },
  });

  const usa = await prisma.country.upsert({
    where: { code: 'US' },
    update: {},
    create: {
      name: 'United States',
      code: 'US',
      currency: 'USD',
    },
  });

  // Create cities
  const tashkent = await prisma.city.upsert({
    where: { name_country_id: { name: 'Tashkent', country_id: uzbekistan.id } },
    update: {},
    create: {
      name: 'Tashkent',
      country_id: uzbekistan.id,
      timezone: 'Asia/Tashkent',
    },
  });

  const newYork = await prisma.city.upsert({
    where: { name_country_id: { name: 'New York', country_id: usa.id } },
    update: {},
    create: {
      name: 'New York',
      country_id: usa.id,
      timezone: 'America/New_York',
    },
  });

  // Create airports
  const tas = await prisma.airport.upsert({
    where: { code: 'TAS' },
    update: {},
    create: {
      code: 'TAS',
      name: 'Tashkent International Airport',
      city_id: tashkent.id,
    },
  });

  const jfk = await prisma.airport.upsert({
    where: { code: 'JFK' },
    update: {},
    create: {
      code: 'JFK',
      name: 'John F. Kennedy International Airport',
      city_id: newYork.id,
    },
  });

  // Create companies
  const uzairways = await prisma.company.upsert({
    where: { code: 'HY' },
    update: {},
    create: {
      name: 'Uzbekistan Airways',
      code: 'HY',
      website: 'https://www.uzairways.com',
    },
  });

  // Create planes
  const plane1 = await prisma.plane.upsert({
    where: { registration: 'UK32001' },
    update: {},
    create: {
      model: 'Boeing 787-8',
      registration: 'UK32001',
      capacity: 250,
      company_id: uzairways.id,
    },
  });

  // Create classes
  const economy = await prisma.class.upsert({
    where: { name: 'Economy' },
    update: {},
    create: {
      name: 'Economy',
      baggage_weight: 20,
    },
  });

  const business = await prisma.class.upsert({
    where: { name: 'Business' },
    update: {},
    create: {
      name: 'Business',
      baggage_weight: 30,
      meal_service: true,
      priority_boarding: true,
    },
  });

  // Create seats
  for (let i = 1; i <= 50; i++) {
    await prisma.seat.upsert({
      where: { plane_id_seat_number: { plane_id: plane1.id, seat_number: `1${i.toString().padStart(2, '0')}` } },
      update: {},
      create: {
        plane_id: plane1.id,
        class_id: economy.id,
        seat_number: `1${i.toString().padStart(2, '0')}`,
        is_window: i % 3 === 0,
        is_aisle: i % 3 === 1,
      },
    });
  }

  // Create flights
  const flight1 = await prisma.flight.upsert({
    where: { flight_number_departure_time: { flight_number: 'HY101', departure_time: new Date('2024-12-01T10:00:00Z') } },
    update: {},
    create: {
      flight_number: 'HY101',
      plane_id: plane1.id,
      departure_airport_id: tas.id,
      arrival_airport_id: jfk.id,
      departure_time: new Date('2024-12-01T10:00:00Z'),
      arrival_time: new Date('2024-12-01T18:00:00Z'),
      base_price: 800.00,
    },
  });

  // Create admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { email: 'admin@airways.uz' },
    update: {},
    create: {
      email: 'admin@airways.uz',
      password: hashedPassword,
      username: 'admin',
      full_name: 'System Admin',
      role: 'SUPER_ADMIN',
    },
  });

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      full_name: 'Test User',
      phone: '+998901234567',
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
