import {PrismaClient} from '@/generated/prisma/client.ts'
import {getDatabaseUrl} from '@/database-url.ts'
import {PrismaPg} from '@prisma/adapter-pg'


declare global {
    var __prisma: PrismaClient | undefined
}


//  改成单例模式
const createPrismaClient = () => {
    const adapter = new PrismaPg({
        connectionString: getDatabaseUrl(),
    })
    return new PrismaClient({adapter})
}

export const prisma = globalThis.__prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma
}
