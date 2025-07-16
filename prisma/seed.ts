import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://avatars.githubusercontent.com/u/1234567?v=4',
    },
  })

  // Create a test document
  const document = await prisma.document.create({
    data: {
      title: 'Welcome to CollabPad',
      content: '# Welcome to CollabPad\n\nThis is a **test document** to get you started.\n\n## Features\n\n- Real-time collaboration\n- Markdown support\n- CRDT sync\n\nStart editing to see the magic happen!',
      ownerId: user.id,
      isPublic: true,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Created user: ${user.email}`)
  console.log(`📄 Created document: ${document.title}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 