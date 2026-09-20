import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const categorySeed = [
  ["Ароматы для дома", "aromaty-dlya-doma", "Диффузоры, спреи и интерьерные ароматы.", "/categories/home-fragrance.svg", 1],
  ["Ароматы для автомобиля", "aromaty-dlya-avto", "Автомобильные ароматизаторы разных форматов.", "/categories/car-fragrance.svg", 2],
  ["Парфюмерия", "parfyumeriya", "Компактные ароматы и подарочные позиции.", "/categories/perfume.svg", 3],
  ["Товары для дома", "tovary-dlya-doma", "Практичные сопутствующие товары для розницы.", "/categories/home-goods.svg", 4],
] as const;

const productSeed = [
  { name: "Аромадиффузор Белый хлопок, 100 мл", article: "HOME-001", price: 449, oldPrice: 529, purchasePrice: 230, stock: 64, minOrder: 2, image: "/demo/diffuser-cotton.svg", description: "Мягкий чистый аромат для дома. Комплект с ротанговыми палочками.", category: "Ароматы для дома", isHit: true, isSuperPrice: true },
  { name: "Аромадиффузор Чёрная ваниль, 100 мл", article: "HOME-002", price: 469, oldPrice: null, purchasePrice: 245, stock: 42, minOrder: 2, image: "/demo/diffuser-vanilla.svg", description: "Тёплый сладковатый аромат для гостиной и спальни.", category: "Ароматы для дома", isNew: true },
  { name: "Спрей для дома Свежий лён, 250 мл", article: "HOME-003", price: 319, oldPrice: null, purchasePrice: 155, stock: 35, minOrder: 3, image: "/demo/home-spray.svg", description: "Быстро освежает помещение и текстиль.", category: "Ароматы для дома", isNew: true },
  { name: "Автоароматизатор New Car", article: "CAR-001", price: 189, oldPrice: 229, purchasePrice: 78, stock: 120, minOrder: 5, image: "/demo/car-new.svg", description: "Стойкий аромат нового автомобиля, подвесной формат.", category: "Ароматы для автомобиля", isHit: true, isSuperPrice: true },
  { name: "Автоароматизатор Морской бриз", article: "CAR-002", price: 199, oldPrice: null, purchasePrice: 82, stock: 94, minOrder: 5, image: "/demo/car-ocean.svg", description: "Свежий универсальный аромат для салона автомобиля.", category: "Ароматы для автомобиля", isHit: true },
  { name: "Ароматизатор на дефлектор Цитрус", article: "CAR-003", price: 259, oldPrice: null, purchasePrice: 118, stock: 58, minOrder: 3, image: "/demo/car-citrus.svg", description: "Компактный флакон на дефлектор с регулируемой интенсивностью.", category: "Ароматы для автомобиля", isNew: true },
  { name: "Мини-парфюм Amber, 20 мл", article: "PERF-001", price: 549, oldPrice: 649, purchasePrice: 295, stock: 26, minOrder: 2, image: "/demo/perfume-amber.svg", description: "Компактный формат для витрины и подарка.", category: "Парфюмерия", isSuperPrice: true },
  { name: "Подарочный пакет крафт, средний", article: "HOMEGOODS-001", price: 69, oldPrice: null, purchasePrice: 27, stock: 180, minOrder: 10, image: "/demo/bag.svg", description: "Универсальная упаковка для подарочных наборов.", category: "Товары для дома" },
] as const;

async function main() {
  const categoryIds = new Map<string, number>();
  for (const [name, slug, description, image, sortOrder] of categorySeed) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name, description, image, sortOrder, active: true },
      create: { name, slug, description, image, sortOrder },
    });
    categoryIds.set(name, category.id);
  }

  for (const product of productSeed) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Не найдена категория ${product.category}`);
    await prisma.product.upsert({
      where: { article: product.article },
      update: {},
      create: {
        name: product.name,
        article: product.article,
        price: product.price,
        oldPrice: product.oldPrice,
        purchasePrice: product.purchasePrice,
        stock: product.stock,
        minOrder: product.minOrder,
        image: product.image,
        description: product.description,
        categoryId,
        isNew: "isNew" in product ? Boolean(product.isNew) : false,
        isHit: "isHit" in product ? Boolean(product.isHit) : false,
        isSuperPrice: "isSuperPrice" in product ? Boolean(product.isSuperPrice) : false,
      },
    });
  }

  const directorPhone = "+79990000000";
  const director = await prisma.user.upsert({
    where: { phone: directorPhone },
    update: { role: "DIRECTOR", active: true },
    create: {
      name: "Генеральный директор",
      phone: directorPhone,
      shopName: "ПЕРСПЕКТИВА",
      role: "DIRECTOR",
      passwordHash: await hashPassword("Admin12345"),
    },
  });

  const fieldPhone = "+79991111111";
  const fieldUser = await prisma.user.upsert({
    where: { phone: fieldPhone },
    update: { role: "FIELD", active: true },
    create: {
      name: "Выездной сотрудник",
      phone: fieldPhone,
      shopName: "ПЕРСПЕКТИВА",
      role: "FIELD",
      passwordHash: await hashPassword("Field12345"),
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, brandName: "ПЕРСПЕКТИВА", tagline: "Оптовые решения для розницы", city: "Ваш город" },
  });

  const store1 = await prisma.store.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Магазин у дома",
      phone: "+79001234567",
      address: "ул. Центральная, 12",
      latitude: 55.751244,
      longitude: 37.618423,
      contactName: "Марина",
      openingHours: "09:00–21:00",
      exteriorImage: "/demo/store-1.svg",
      status: "ACTIVE",
      source: "FIELD",
      createdById: fieldUser.id,
    },
  });
  const store2 = await prisma.store.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Продукты 24",
      phone: "+79007654321",
      address: "пр-т Мира, 45",
      latitude: 55.7602,
      longitude: 37.6251,
      contactName: "Ольга",
      openingHours: "Круглосуточно",
      exteriorImage: "/demo/store-2.svg",
      status: "ACTIVE",
      source: "FIELD",
      createdById: fieldUser.id,
    },
  });

  const defaultLine = await prisma.routeLine.upsert({
    where: { title: "Линия №1" },
    update: { active: true },
    create: { title: "Линия №1", areaSummary: "Основная демонстрационная линия", active: true },
  });
  await prisma.store.update({ where: { id: store1.id }, data: { routeLineId: defaultLine.id, routeOrder: 1 } });
  await prisma.store.update({ where: { id: store2.id }, data: { routeLineId: defaultLine.id, routeOrder: 2 } });

  await prisma.shelf.upsert({
    where: { code: "P-0001" },
    update: { storeId: store1.id, status: "INSTALLED" },
    create: { code: "P-0001", storeId: store1.id, status: "INSTALLED", installedAt: new Date(), notes: "Полка у кассы" },
  });
  await prisma.shelf.upsert({
    where: { code: "P-0002" },
    update: { storeId: store2.id, status: "INSTALLED" },
    create: { code: "P-0002", storeId: store2.id, status: "INSTALLED", installedAt: new Date(), notes: "Полка рядом с напитками" },
  });
  await prisma.shelf.upsert({
    where: { code: "P-0003" },
    update: {},
    create: { code: "P-0003", status: "IN_STOCK" },
  });

  const products = await prisma.product.findMany({ orderBy: { id: "asc" }, take: 4 });
  let customer = await prisma.user.findUnique({ where: { phone: "+79002223344" } });
  if (!customer) {
    customer = await prisma.user.create({
      data: {
        name: "Марина",
        phone: "+79002223344",
        shopName: store1.name,
        role: "CUSTOMER",
        passwordHash: await hashPassword("Customer123"),
        storeMemberships: { create: { storeId: store1.id, role: "OWNER" } },
      },
    });
  }

  let order = await prisma.order.findFirst({ where: { userId: customer.id, storeId: store1.id } });
  if (!order && products.length >= 2) {
    order = await prisma.order.create({
      data: {
        userId: customer.id,
        storeId: store1.id,
        status: "PROCESSING",
        paymentStatus: "UNPAID",
        total: products[0].price * 4 + products[1].price * 3,
        comment: "Позвонить за 20 минут",
        items: {
          create: [
            { productId: products[0].id, productName: products[0].name, article: products[0].article, price: products[0].price, purchasePrice: products[0].purchasePrice, quantity: 4 },
            { productId: products[1].id, productName: products[1].name, article: products[1].article, price: products[1].price, purchasePrice: products[1].purchasePrice, quantity: 3 },
          ],
        },
      },
    });
  }

  const existingRoute = await prisma.deliveryRoute.findFirst({ where: { title: "Демонстрационный маршрут" } });
  if (!existingRoute) {
    await prisma.deliveryRoute.create({
      data: {
        title: "Демонстрационный маршрут",
        routeDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        assignedUserId: fieldUser.id,
        lineId: defaultLine.id,
        stops: {
          create: [
            { storeId: store1.id, orderId: order?.id, sequence: 1, note: "Проверить выкладку и принять оплату" },
            { storeId: store2.id, sequence: 2, note: "Предложить новинки и сфотографировать полку" },
          ],
        },
      },
    });
  }

  const financeCategories = [
    ["INCOME", "Оплата магазина"], ["INCOME", "Продажи"], ["INCOME", "Прочие поступления"],
    ["EXPENSE", "Закупка товара"], ["EXPENSE", "Топливо"], ["EXPENSE", "Зарплата"], ["EXPENSE", "Аренда"],
    ["EXPENSE", "Склад"], ["EXPENSE", "Ремонт автомобиля"], ["EXPENSE", "Реклама"], ["EXPENSE", "Налоги"],
    ["EXPENSE", "Связь"], ["EXPENSE", "Упаковка"], ["EXPENSE", "Прочее"],
  ] as const;
  for (const [type, name] of financeCategories) {
    await prisma.financeCategory.upsert({ where: { name_type: { name, type } }, update: { active: true }, create: { name, type } });
  }

  const financeCount = await prisma.financeEntry.count();
  if (financeCount === 0) {
    await prisma.financeEntry.createMany({
      data: [
        { type: "INCOME", category: "Продажи", amount: 28500, note: "Оплаты магазинов", createdById: director.id },
        { type: "EXPENSE", category: "Закупка", amount: 12800, note: "Поставка ароматизаторов", createdById: director.id },
        { type: "EXPENSE", category: "Топливо", amount: 2400, note: "Недельный объезд", createdById: director.id },
      ],
    });
  }

  const promotionCount = await prisma.promotion.count();
  if (promotionCount === 0) {
    await prisma.promotion.createMany({
      data: [
        { title: "Суперцены недели", subtitle: "Выгодные позиции для розничных магазинов", badge: "СУПЕРЦЕНА", image: "/promo/promo-car.svg", sortOrder: 1 },
        { title: "Готовая товарная полка", subtitle: "Подборка ходовых товаров для быстрого старта", badge: "ГОТОВОЕ РЕШЕНИЕ", image: "/promo/promo-shelf.svg", sortOrder: 2 },
      ],
    });
  }

  console.log("Данные ПЕРСПЕКТИВЫ подготовлены.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
