
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Starting Cleanup...')

    // Delete all selections to clear bad data
    const { count } = await prisma.selection.deleteMany({})

    console.log(`✅ Deleted ${count} selections.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
