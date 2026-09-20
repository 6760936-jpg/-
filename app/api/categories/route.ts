import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
export async function GET(){const categories=await prisma.category.findMany({orderBy:[{sortOrder:"asc"},{id:"asc"}]});return NextResponse.json(categories)}
