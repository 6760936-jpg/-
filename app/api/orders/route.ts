import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiAdmin, getApiUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
type CheckoutItemInput = { productId?: unknown; quantity?: unknown };
type CheckoutInput = { comment?: unknown; items?: unknown };
function cleanText(value: unknown, maxLength: number): string { return typeof value === "string" ? value.trim().slice(0, maxLength) : ""; }

export async function GET() {
  const admin = await getApiAdmin(); if (admin instanceof NextResponse) return admin;
  const orders = await prisma.order.findMany({ include: { user: { select: { id: true, name: true, phone: true, shopName: true } }, store: { select: { id: true, name: true, address: true } }, items: { orderBy: { id: "asc" } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const user = await getApiUser(); if (user instanceof NextResponse) return user;
  try {
    const body = (await request.json()) as CheckoutInput; const comment = cleanText(body.comment, 1000);
    if (!Array.isArray(body.items) || body.items.length === 0) return NextResponse.json({ error: "Корзина пуста." }, { status: 400 });
    const quantities = new Map<number, number>();
    for (const raw of body.items as CheckoutItemInput[]) { const productId=Number(raw.productId), quantity=Number(raw.quantity); if(!Number.isInteger(productId)||productId<=0||!Number.isInteger(quantity)||quantity<=0) return NextResponse.json({error:"Некорректная позиция."},{status:400}); quantities.set(productId,(quantities.get(productId)??0)+quantity); }
    const products = await prisma.product.findMany({ where: { id: { in: [...quantities.keys()] }, active: true } });
    if (products.length !== quantities.size) return NextResponse.json({ error: "Один из товаров недоступен." }, { status: 409 });
    for (const p of products) { const q=quantities.get(p.id)??0; if(q>p.stock) return NextResponse.json({error:`Недостаточный остаток «${p.name}». Доступно: ${p.stock}.`},{status:409}); if(q<p.minOrder) return NextResponse.json({error:`Минимальный заказ «${p.name}»: ${p.minOrder} шт.`},{status:400}); }
    const total=products.reduce((s,p)=>s+p.price*(quantities.get(p.id)??0),0);
    const membership=await prisma.storeMembership.findFirst({where:{userId:user.id,active:true},orderBy:{createdAt:"asc"}});
    const order=await prisma.$transaction(async tx=>{
      for(const p of products){const q=quantities.get(p.id)??0;const updated=await tx.product.updateMany({where:{id:p.id,stock:{gte:q}},data:{stock:{decrement:q}}});if(updated.count!==1)throw new Error(`STOCK:${p.name}`);await tx.inventoryMovement.create({data:{productId:p.id,userId:user.id,type:"ORDER_RESERVE",quantity:-q,note:"Резерв под заказ"}});}
      return tx.order.create({data:{userId:user.id,storeId:membership?.storeId,status:"NEW",paymentStatus:"UNPAID",comment:comment||null,total,items:{create:products.map(p=>({productId:p.id,productName:p.name,article:p.article,price:p.price,purchasePrice:p.purchasePrice,quantity:quantities.get(p.id)??1}))}},include:{user:{select:{id:true,name:true,phone:true,shopName:true}},store:{select:{id:true,name:true,address:true}},items:true}});
    });
    return NextResponse.json(order,{status:201});
  } catch(error){if(error instanceof Error&&error.message.startsWith("STOCK:"))return NextResponse.json({error:`Остаток «${error.message.slice(6)}» изменился.`},{status:409});console.error(error);return NextResponse.json({error:"Не удалось сохранить заказ."},{status:500});}
}
