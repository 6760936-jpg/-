import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
function cell(value: string|number|null){const s=String(value??"").replace(/"/g,'""');return `"${s}"`;}
export async function GET(){const products=await prisma.product.findMany({where:{active:true},include:{category:true},orderBy:[{category:{name:"asc"}},{name:"asc"}]});const rows=[["Артикул","Название","Категория","Цена","Старая цена","Остаток","Минимальный заказ"],...products.map(p=>[p.article,p.name,p.category.name,p.price,p.oldPrice??"",p.stock,p.minOrder])];const csv='\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n');return new Response(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="perspektiva-price-${new Date().toISOString().slice(0,10)}.csv"`}})}
