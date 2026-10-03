# Vestora

Vestora is a Next.js storefront with customer, seller, and admin flows backed by MySQL.

## Getting Started

Install dependencies, configure the MySQL values in `.env`, then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Seed the database with the demo admin, customer, and products:

```bash
npm run db:seed
```

For products with variants such as clothing, add the size inventory column once before publishing products:

```bash
npm run db:migrate:sizes
```

## Accounts

Sellers register at `/seller/register`.

Admins and customers are created from the `ADMIN_*` and `CUSTOMER_*` environment variables used by the seed script.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
