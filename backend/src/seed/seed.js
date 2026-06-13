const pool = require('../db');
const { faker } = require('@faker-js/faker');

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Jaipur'];
const products = ['Kurta', 'Saree', 'Sneakers', 'Handbag', 'Sunglasses', 'Watch', 'Perfume', 'Jacket', 'Jeans', 'T-Shirt'];

async function seed() {
  console.log('🌱 Seeding started...');

  const customerValues = [];
  const customerParams = [];
  let idx = 1;

  for (let i = 0; i < 200; i++) {
    const name = faker.person.fullName();
    const email = faker.internet.email();
    const phone = faker.phone.number('98########').slice(0, 20);
    const city = cities[Math.floor(Math.random() * cities.length)];
    const totalSpent = parseFloat((Math.random() * 10000 + 200).toFixed(2));
    const lastOrderAt = faker.date.past({ years: 1 });

    customerValues.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    customerParams.push(name, email, phone, city, totalSpent, lastOrderAt);
  }

  await pool.query(
    `INSERT INTO customers (name, email, phone, city, total_spent, last_order_at)
     VALUES ${customerValues.join(',')}
     ON CONFLICT (email) DO NOTHING`,
    customerParams
  );

  console.log('✅ Seeded 200 customers!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});