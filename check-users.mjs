import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const users = await prisma.user.findMany({
  select: { id: true, phone: true, name: true, role: true }
})
console.log('Всего пользователей:', users.length)
console.log(users)
await prisma.$disconnect()
