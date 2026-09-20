import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireField } from "@/lib/auth";
import { FieldOrderForm } from "@/components/FieldOrderForm";
export const dynamic="force-dynamic";
export default async function FieldOrderPage({params}:{params:Promise<{id:string}>}){await requireField();const{id}=await params;const[store,products]=await Promise.all([prisma.store.findUnique({where:{id:Number(id)}}),prisma.product.findMany({where:{active:true,stock:{gt:0}},include:{category:true},orderBy:[{category:{name:"asc"}},{name:"asc"}]})]);if(!store)notFound();return <div className="container-page max-w-7xl"><div><p className="eyebrow">Продажа на месте</p><h1 className="mt-2 text-3xl font-semibold">{store.name}</h1><p className="mt-2 text-zinc-500">Выберите фактически переданный товар и отметьте способ оплаты.</p></div><div className="mt-8"><FieldOrderForm storeId={store.id} products={products}/></div></div>}
