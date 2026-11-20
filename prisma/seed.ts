/**
 * Seed data resmi Kopi Teras (@kopiteras_pasmod):
 * - 14 meja (Indoor IN-01..08 & Outdoor OUT-01..06) + simpan semua PNG QR ke public/qrcodes/
 * - 42 menu resmi sesuai daftar menu Instagram @kopiteras_pasmod (harga real tanpa harga coret)
 * - 3 akun staf (admin, kasir, dapur)
 *
 * Jalankan: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { saveTableQrFile } from "../src/lib/qr-files";

const prisma = new PrismaClient();

const TABLES = [
  ...Array.from({ length: 8 }, (_, i) => ({
    tableNumber: `IN-${String(i + 1).padStart(2, "0")}`,
    location: "Indoor",
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    tableNumber: `OUT-${String(i + 1).padStart(2, "0")}`,
    location: "Outdoor",
  })),
];

type SeedMenu = {
  name: string;
  description: string;
  category: "Coffee" | "Non-Coffee" | "Snack" | "Main Course" | "Promo";
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
};

const MENUS: SeedMenu[] = [
  // ==================== COFFEE ====================
  {
    name: "Kopi Aren Teras",
    description: "Espresso, brown sugar, milk, ice.",
    category: "Coffee",
    price: 23000,
    imageUrl: "/menus/kopi-aren-teras.jpg",
  },
  {
    name: "Americano",
    description: "Espresso, water, ice.",
    category: "Coffee",
    price: 15000,
    imageUrl: "/menus/americano.jpg",
  },
  {
    name: "Berrycano",
    description: "Espresso, strawberry syrup, soda water, ice.",
    category: "Coffee",
    price: 25000,
    imageUrl: "/menus/berrycano.jpg",
  },
  {
    name: "Montblanc",
    description: "Espresso, syrup orange, orange juice, milk foam, ice.",
    category: "Coffee",
    price: 25000,
    imageUrl: "/menus/montblanc.jpg",
  },
  {
    name: "Americano Peach",
    description: "Espresso, syrup peach, ice.",
    category: "Coffee",
    price: 20000,
    imageUrl: "/menus/americano-peach.jpg",
  },
  {
    name: "Latte / Cappuccino",
    description: "Espresso, milk, ice.",
    category: "Coffee",
    price: 20000,
    imageUrl: "/menus/latte-cappuccino.jpg",
  },
  {
    name: "Machiato",
    description: "Espresso, syrup caramel, milk, soft foam, ice.",
    category: "Coffee",
    price: 25000,
    imageUrl: "/menus/machiato.jpg",
  },
  {
    name: "Mochacino",
    description: "Espresso, syrup vanilla, milk, chocolate, ice.",
    category: "Coffee",
    price: 25000,
    imageUrl: "/menus/mochacino.jpg",
  },
  {
    name: "Caramel Latte",
    description: "Espresso, syrup caramel, milk, ice.",
    category: "Coffee",
    price: 23000,
    imageUrl: "/menus/caramel-latte.jpg",
  },
  {
    name: "Hazelnut Latte",
    description: "Espresso, syrup hazelnut, milk, ice.",
    category: "Coffee",
    price: 23000,
    imageUrl: "/menus/hazelnut-latte.jpg",
  },
  {
    name: "Vanilla Latte",
    description: "Espresso, syrup vanilla, milk, ice.",
    category: "Coffee",
    price: 23000,
    imageUrl: "/menus/vanilla-latte.jpg",
  },
  {
    name: "Butterscotch Latte",
    description: "Espresso, syrup butterscotch, milk, milk foam, ice.",
    category: "Coffee",
    price: 23000,
    imageUrl: "/menus/butterscotch-latte.jpg",
  },
  {
    name: "Salted Caramel",
    description: "Espresso, syrup salted caramel, milk, ice.",
    category: "Coffee",
    price: 23000,
    imageUrl: "/menus/salted-caramel.jpg",
  },

  // ==================== NON-COFFEE ====================
  {
    name: "Chocolate Signature",
    description: "Chocolate, milk, ice.",
    category: "Non-Coffee",
    price: 23000,
    imageUrl: "/menus/chocolate-signature.jpg",
  },
  {
    name: "Red Velvet",
    description: "Powder red velvet, milk, ice.",
    category: "Non-Coffee",
    price: 23000,
    imageUrl: "/menus/red-velvet.jpg",
  },
  {
    name: "Matcha",
    description: "Matcha, milk, ice.",
    category: "Non-Coffee",
    price: 24000,
    imageUrl: "/menus/matcha.jpg",
  },
  {
    name: "Cookies & Cream",
    description: "Powder cookies and cream, milk, soft foam, ice, crumb oreo.",
    category: "Non-Coffee",
    price: 23000,
    imageUrl: "/menus/cookies-and-cream.jpg",
  },
  {
    name: "Chocoberry",
    description: "Chocolate, syrup strawberry, milk, ice.",
    category: "Non-Coffee",
    price: 25000,
    imageUrl: "/menus/chocoberry.jpg",
  },
  {
    name: "Matchaberry",
    description: "Matcha, milk, foam strawberry, ice.",
    category: "Non-Coffee",
    price: 25000,
    imageUrl: "/menus/matchaberry.jpg",
  },
  {
    name: "Lemon Tea",
    description: "Tea, syrup lemon, sugar, ice.",
    category: "Non-Coffee",
    price: 15000,
    imageUrl: "/menus/lemon-tea.jpg",
  },
  {
    name: "Leci Tea",
    description: "Tea, syrup leci, sugar, ice.",
    category: "Non-Coffee",
    price: 17000,
    imageUrl: "/menus/leci-tea.jpg",
  },
  {
    name: "Peach Tea",
    description: "Tea, syrup peach, sugar, ice.",
    category: "Non-Coffee",
    price: 15000,
    imageUrl: "/menus/peach-tea.jpg",
  },
  {
    name: "Ocean Blue",
    description: "Syrup blue citrus, syrup lemon, soda water, ice.",
    category: "Non-Coffee",
    price: 16000,
    imageUrl: "/menus/ocean-blue.jpg",
  },
  {
    name: "Leci Yakult",
    description: "Syrup leci, 2 yakult, ice.",
    category: "Non-Coffee",
    price: 18000,
    imageUrl: "/menus/leci-yakult.jpg",
  },
  {
    name: "Mango Yakult",
    description: "Powder mango, 2 yakult, ice.",
    category: "Non-Coffee",
    price: 16000,
    imageUrl: "/menus/mango-yakult.jpg",
  },
  {
    name: "Air Mineral Prim-A",
    description: "Air mineral botol 600ml.",
    category: "Non-Coffee",
    price: 5000,
    imageUrl: "/menus/air-mineral.jpg",
  },

  // ==================== MAIN COURSE (MBG — Makanan Berat) ====================
  {
    name: "Nasi Goreng Teras",
    description: "Sosis, bakso, ayam, telur mata sapi.",
    category: "Main Course",
    price: 20000,
    imageUrl: "/menus/nasi-goreng-teras.jpg",
  },
  {
    name: "Nasi Goreng Katsu",
    description: "Nasi goreng dengan chicken katsu dan kerupuk.",
    category: "Main Course",
    price: 25000,
    imageUrl: "/menus/nasi-goreng-katsu.jpg",
  },
  {
    name: "Dori Sambal Matah",
    description: "Nasi hangat dengan crispy dori dan sambal matah.",
    category: "Main Course",
    price: 28000,
    imageUrl: "/menus/dori-sambal-matah.jpg",
  },
  {
    name: "Rice Bowl Katsu",
    description: "Nasi hangat dengan chicken katsu, sayuran, dan saus.",
    category: "Main Course",
    price: 20000,
    imageUrl: "/menus/rice-bowl-katsu.jpg",
  },
  {
    name: "Ayam Saus BBQ",
    description: "Nasi hangat dengan potongan ayam saus BBQ.",
    category: "Main Course",
    price: 25000,
    imageUrl: "/menus/ayam-saus-bbq.jpg",
  },
  {
    name: "Ayam Lada Hitam",
    description: "Nasi hangat dengan potongan ayam saus lada hitam.",
    category: "Main Course",
    price: 25000,
    imageUrl: "/menus/ayam-lada-hitam.jpg",
  },
  {
    name: "Beef Lada Hitam",
    description: "Nasi hangat dengan sliced beef lada hitam dan telur.",
    category: "Main Course",
    price: 28000,
    imageUrl: "/menus/beef-lada-hitam.jpg",
  },

  // ==================== SNACK ====================
  {
    name: "French Fries",
    description: "Kentang goreng renyah.",
    category: "Snack",
    price: 15000,
    imageUrl: "/menus/french-fries.jpg",
  },
  {
    name: "Teras Platter",
    description: "Kentang, sosis, nugget.",
    category: "Snack",
    price: 20000,
    imageUrl: "/menus/teras-platter.jpg",
  },
  {
    name: "Cireng Rujak",
    description: "Isi 10 pcs lengkap dengan bumbu rujak.",
    category: "Snack",
    price: 20000,
    imageUrl: "/menus/cireng-rujak.jpg",
  },
  {
    name: "Dimsum",
    description: "Isi 3 pcs.",
    category: "Snack",
    price: 18000,
    imageUrl: "/menus/dimsum.jpg",
  },
  {
    name: "Dimsum Mentai",
    description: "Isi 4 pcs dengan saus mentai.",
    category: "Snack",
    price: 22000,
    imageUrl: "/menus/dimsum-mentai.jpg",
  },
  {
    name: "Tempe Mendoan",
    description: "Isi 10 pcs.",
    category: "Snack",
    price: 15000,
    imageUrl: "/menus/tempe-mendoan.jpg",
  },
  {
    name: "Roti Bakar",
    description: "Roti bakar cokelat keju.",
    category: "Snack",
    price: 16000,
    imageUrl: "/menus/roti-bakar.jpg",
  },
  {
    name: "Pisang Bakar",
    description: "Pisang bakar cokelat keju.",
    category: "Snack",
    price: 15000,
    imageUrl: "/menus/pisang-bakar.jpg",
  },
  {
    name: "Tahu Garem Cabe",
    description: "Tahu crispy tumis bawang cabai garam.",
    category: "Snack",
    price: 15000,
    imageUrl: "/menus/tahu-garem-cabe.jpg",
  },
];

const USERS = [
  { username: "admin", name: "Manajer Kopi Teras", password: "admin123", role: "ADMIN" as const },
  { username: "kasir", name: "Kasir Shift", password: "kasir123", role: "CASHIER" as const },
  { username: "dapur", name: "Tim Dapur", password: "dapur123", role: "KITCHEN" as const },
];

async function main() {
  console.log("Seeding Kopi Teras (@kopiteras_pasmod)...");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  for (const table of TABLES) {
    const saved = await prisma.table.upsert({
      where: { tableNumber: table.tableNumber },
      update: {},
      create: table,
    });
    await saveTableQrFile(saved, baseUrl);
  }
  console.log(`  - ${TABLES.length} meja & gambar QR tersimpan di public/qrcodes/`);

  const officialNames = MENUS.map((m) => m.name);
  await prisma.menu.deleteMany({
    where: {
      name: { notIn: officialNames },
      orderItems: { none: {} },
    },
  });

  for (const menu of MENUS) {
    const existing = await prisma.menu.findFirst({ where: { name: menu.name } });
    if (existing) {
      await prisma.menu.update({
        where: { id: existing.id },
        data: {
          description: menu.description,
          category: menu.category,
          price: menu.price,
          promoPrice: null,
          imageUrl: menu.imageUrl ?? null,
          isAvailable: menu.isAvailable ?? true,
        },
      });
    } else {
      await prisma.menu.create({
        data: {
          name: menu.name,
          description: menu.description,
          category: menu.category,
          price: menu.price,
          promoPrice: null,
          imageUrl: menu.imageUrl ?? null,
          isAvailable: menu.isAvailable ?? true,
        },
      });
    }
  }
  console.log(`  - ${MENUS.length} menu resmi disinkronkan (harga real tanpa harga coret)`);

  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: { username: user.username, name: user.name, role: user.role, passwordHash },
    });
  }
  console.log("  - akun staf: admin/admin123, kasir/kasir123, dapur/dapur123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
