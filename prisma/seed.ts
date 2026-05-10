import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Pre-seed static user data
  const user1 = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      balance: 1000,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      balance: 500,
    },
  })

  console.log('Seeded users:', { user1, user2 })
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