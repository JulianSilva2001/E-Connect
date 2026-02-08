
import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await hash('password123', 12)

    // Create Mentors
    const mentorsData = [
        {
            email: 'dr.perera@uom.lk',
            name: 'Dr. Ajith Perera',
            bio: 'Senior Lecturer at ENTC. Specialized in Signal Processing and Machine Learning. I enjoy helping students navigate their academic careers.',
            expertise: ['Signal Processing', 'Machine Learning', 'AI', 'Embedded Systems'],
            organization: 'University of Moratuwa',
            graduationYear: 2005,
            availability: 'Available'
        },
        {
            email: 'sarah.fernando@google.com',
            name: 'Sarah Fernando',
            bio: 'Software Engineer at Google. ENTC Alumni (Batch 16). Passionate about cloud computing and distributed systems.',
            expertise: ['Cloud Computing', 'Software Engineering', 'Distributed Systems', 'Go'],
            organization: 'Google',
            graduationYear: 2018,
            availability: 'Limited'
        },
        {
            email: 'nuwan.j@wso2.com',
            name: 'Nuwan Jayasinghe',
            bio: 'Associate Tech Lead at WSO2. I can help with open source contribution and middleware technologies.',
            expertise: ['Middleware', 'Open Source', 'Java', 'Microservices'],
            organization: 'WSO2',
            graduationYear: 2017,
            availability: 'Available'
        },
        {
            email: 'dilshan.r@dialog.lk',
            name: 'Dilshan Rajapaksa',
            bio: 'Telecommunications Engineer at Dialog Axiata. Expert in 5G networks and IoT.',
            expertise: ['Telecommunications', '5G', 'IoT', 'Networking'],
            organization: 'Dialog Axiata',
            graduationYear: 2016,
            availability: 'Unavailable'
        },
        {
            email: 'kavindi.s@mit.edu',
            name: 'Kavindi Silva',
            bio: 'PhD Candidate at MIT. Researching computer vision and robotics. Happy to advise on grad school applications.',
            expertise: ['Computer Vision', 'Robotics', 'Research', 'Academic Writing'],
            organization: 'MIT',
            graduationYear: 2019,
            availability: 'Available'
        },
    ]

    console.log('🌱 Starting Seeding...')

    for (const m of mentorsData) {
        const user = await prisma.user.upsert({
            where: { email: m.email },
            update: {},
            create: {
                email: m.email,
                name: m.name,
                password,
                role: Role.MENTOR,
                mentorProfile: {
                    create: {
                        bio: m.bio,
                        expertise: m.expertise,
                    }
                }
            },
        })
        console.log(`Created mentor: ${user.name}`)
    }

    // Create Mentees
    const menteesData = [
        { email: 'student1@uom.lk', name: 'Kasun De Silva', interests: ['AI', 'Robotics'] },
        { email: 'student2@uom.lk', name: 'Amaya Perera', interests: ['Software Engineering', 'Cloud'] },
    ]

    for (const m of menteesData) {
        const user = await prisma.user.upsert({
            where: { email: m.email },
            update: {},
            create: {
                email: m.email,
                name: m.name,
                password,
                role: Role.MENTEE,
                menteeProfile: {
                    create: {
                        interests: m.interests
                    }
                }
            },
        })
        console.log(`Created mentee: ${user.name}`)
    }

    console.log('✅ Seeding finished.')
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
