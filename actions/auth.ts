
'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { saltAndHashPassword } from '@/lib/password';
import { Role } from '@prisma/client';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(['MENTOR', 'MENTEE']),
    // Extended fields
    organization: z.string().optional(),
    jobTitle: z.string().optional(),
    graduationYear: z.coerce.number().optional(), // Coerce from string input
    linkedIn: z.string().optional(),
    expectations: z.string().optional(),
    expertise: z.string().optional(), // Comma separated string from form, split later
    preferredMentees: z.coerce.number().optional().default(2), // Default to 2
    batch: z.string().optional(),
    interests: z.string().optional(), // Comma separated string
    bio: z.string().optional(),
    portfolio: z.string().optional(),
    cvLink: z.string().optional(),
    github: z.string().optional(),
    menteeLinkedin: z.string().optional(), // Distinct from mentor's linkedIn to avoid confusion/types issues if possible, or just share
    motivation: z.string().optional(),
    goal: z.string().optional(),
});

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: 'Invalid fields!' };
    }

    const {
        email, password, name, role,
        organization, jobTitle, graduationYear, linkedIn, expectations, expertise, preferredMentees,
        batch, interests,
        bio, portfolio, cvLink, github, menteeLinkedin, motivation, goal
    } = validatedFields.data;

    // ... (rest of validation)

    const existingUser = await db.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: 'Email already in use!' };
    }

    const hashedPassword = await saltAndHashPassword(password);

    // Transaction to create user and profile
    try {
        await db.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: role as Role,
                },
            });

            if (role === 'MENTOR') {
                await tx.mentorProfile.create({
                    data: {
                        userId: user.id,
                        organization: organization || undefined,
                        jobTitle: jobTitle || undefined,
                        graduationYear: graduationYear || undefined,
                        linkedIn: linkedIn || undefined,
                        expectations: expectations || undefined,
                        expertise: expertise ? expertise.split(',').map(s => s.trim()) : [],
                        preferredMentees: preferredMentees || 2
                    }
                })
            } else {
                await tx.menteeProfile.create({
                    data: {
                        userId: user.id,
                        batch: batch || undefined,
                        interests: interests ? interests.split(',').map(s => s.trim()) : [],
                        bio: bio || undefined,
                        portfolio: portfolio || undefined,
                        cvLink: cvLink || undefined,
                        github: github || undefined,
                        linkedin: menteeLinkedin || undefined,
                        motivation: motivation || undefined,
                        goal: goal || undefined,
                    }
                })
            }
        }, {
            maxWait: 5000, // default: 2000
            timeout: 30000 // default: 5000
        });

        return { success: 'User created!' };
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            return { error: `Error: ${error.message}` };
        }
        return { error: 'Something went wrong!' };
    }
};

export const login = async (values: z.infer<typeof RegisterSchema>) => {
    // Basic login wrapper if needed, or calling signIn directly
};
