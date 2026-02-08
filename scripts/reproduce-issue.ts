
import { db } from '@/lib/db';
import { processMentorshipRequest, selectMentor } from '@/actions/mentorship';
import { Role } from '@prisma/client';

async function main() {
    console.log("🚀 Starting reproduction script...");

    // 1. Get Mentor
    const mentor = await db.user.findUnique({
        where: { email: 'dr.perera@uom.lk' },
        include: { mentorProfile: true }
    });

    if (!mentor || !mentor.mentorProfile) {
        console.error("❌ Mentor not found");
        return;
    }

    console.log(`👨‍🏫 Mentor: ${mentor.name}`);
    console.log(`   Capacity (Before): ${mentor.mentorProfile.preferredMentees}`);

    // 2. Get Mentee
    const mentee = await db.user.findUnique({
        where: { email: 'student1@uom.lk' },
        include: { menteeProfile: true }
    });

    if (!mentee || !mentee.menteeProfile) {
        console.error("❌ Mentee not found");
        return;
    }

    console.log(`👨‍🎓 Mentee: ${mentee.name}`);

    // 3. Create Selection (Request)
    // We assume the mentee selects the mentor (Rank 1)
    console.log("📩 simulating selection...");
    // We need to bypass the 'auth' check in selectMentor, so we'll do it directly via DB or mock auth?
    // selectMentor uses 'auth()'. We can't easily mock that in this script without mocking the module.
    // Instead, let's create the selection directly in DB to simulate 'PENDING' state.

    const selection = await db.selection.upsert({
        where: {
            menteeId_rank: {
                menteeId: mentee.menteeProfile.id,
                rank: 1
            }
        },
        update: {
            mentorId: mentor.mentorProfile.id,
            status: 'PENDING'
        },
        create: {
            menteeId: mentee.menteeProfile.id,
            mentorId: mentor.mentorProfile.id,
            rank: 1,
            status: 'PENDING'
        }
    });

    console.log(`   Selection ID: ${selection.id}, Status: ${selection.status}`);

    // 4. Try to Accept check capacity FIRST
    // We can't call processMentorshipRequest directly because it ALSO checks 'auth()'.
    // We have to simulate the logic of processMentorshipRequest here OR mock auth.
    // Let's replicate the logic to see if it holds up.

    console.log("🔄 Testing Logic...");

    // Logic Step 1: Lazy Migration
    let capacity = mentor.mentorProfile.preferredMentees;
    if (capacity === 0) {
        console.log("   ⚠️ Capacity is 0. Attempting migration...");
        await db.mentorProfile.update({
            where: { id: mentor.mentorProfile.id },
            data: { preferredMentees: 5 }
        });
        capacity = 5;
        console.log("   ✅ Migrated capacity to 5.");
    }

    // Logic Step 2: Check Existing Accepted
    const acceptedCount = await db.selection.count({
        where: {
            mentorId: mentor.mentorProfile.id,
            status: 'ACCEPTED'
        }
    });

    console.log(`   Accepted Count: ${acceptedCount}`);
    console.log(`   Capacity: ${capacity}`);

    if (acceptedCount >= capacity) {
        console.error("❌ Capacity Full.");
    } else {
        console.log("   ✅ Capacity OK.");
        // Logic Step 3: Update
        await db.selection.update({
            where: { id: selection.id },
            data: { status: 'ACCEPTED' }
        });
        console.log("   ✅ Request ACCEPTED.");
    }

    // 5. Verify Final State
    const finalSelection = await db.selection.findUnique({ where: { id: selection.id } });
    const finalMentor = await db.mentorProfile.findUnique({ where: { id: mentor.mentorProfile.id } });

    console.log("🏁 Final Results:");
    console.log(`   Selection Status: ${finalSelection?.status}`);
    console.log(`   Mentor Capacity: ${finalMentor?.preferredMentees}`);
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
