const pool = require('../db');
const { faker } = require('@faker-js/faker');

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Jaipur'];
const products = ['Kurta', 'Saree', 'Sneakers', 'Handbag', 'Sunglasses', 'Watch', 'Perfume', 'Jacket', 'Jeans', 'T-Shirt'];

async function seed() {
  console.log('🌱 Seeding started...');

  for (let i = 0; i < 200; i++) {
    const name = faker.person.fullName();
    const email = faker.internet.email();
    const phone = faker.phone.number('98########').slice(0, 20);
    const city = cities[Math.floor(Math.random() * cities.length)];

    // Insert customer
    const customerResult = await pool.query(
      `INSERT INTO customers (name, email, phone, city)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, email, phone, city]
    );

    const customerId = customerResult.rows[0].id;

    // Each customer gets 1–5 orders
    const orderCount = Math.floor(Math.random() * 5) + 1;
    let totalSpent = 0;
    let lastOrderAt = null;

    for (let j = 0; j < orderCount; j++) {
      const amount = parseFloat((Math.random() * 5000 + 200).toFixed(2));
      const product = products[Math.floor(Math.random() * products.length)];
      const createdAt = faker.date.past({ years: 1 });

      await pool.query(
        `INSERT INTO orders (customer_id, amount, product, created_at)
         VALUES ($1, $2, $3, $4)`,
        [customerId, amount, product, createdAt]
      );

      totalSpent += amount;
      if (!lastOrderAt || createdAt > lastOrderAt) lastOrderAt = createdAt;
    }

    // Update customer totals
    await pool.query(
      `UPDATE customers SET total_spent = $1, last_order_at = $2 WHERE id = $3`,
      [totalSpent.toFixed(2), lastOrderAt, customerId]
    );
  }

  console.log('✅ Seeded 200 customers with orders!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});