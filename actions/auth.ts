
'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { saltAndHashPassword } from '@/lib/password';
import { Role } from '@prisma/client';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { getAllowedMenteeBatches } from '@/lib/registration-batches';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(['MENTOR', 'MENTEE']),
    contactNumber: z.string().min(7).max(20),
    // Extended fields
    organization: z.string().optional(),
    jobTitle: z.string().optional(),
    graduationYear: z.coerce.number().optional(), // Coerce from string input
    linkedIn: z.string().optional(),
    expectations: z.string().optional(),
    expertise: z.string().optional(), // Comma separated string from form, split later
    preferredMentees: z.coerce.number().optional(),
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
        email, password, name, role, contactNumber,
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

    if (role === 'MENTEE') {
        const allowedMenteeBatches = await getAllowedMenteeBatches();
        if (!batch || !allowedMenteeBatches.includes(batch)) {
            return { error: 'Please select a valid batch from the registration dropdown.' };
        }
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
                        contactNumber,
                        organization: organization || undefined,
                        jobTitle: jobTitle || undefined,
                        graduationYear: graduationYear || undefined,
                        linkedIn: linkedIn || undefined,
                        expectations: expectations || undefined,
                        expertise: expertise ? expertise.split(',').map(s => s.trim()) : [],
                        preferredMentees: preferredMentees || 2
                    } as any
                })
            } else {
                await tx.menteeProfile.create({
                    data: {
                        userId: user.id,
                        contactNumber,
                        batch: batch || undefined,
                        interests: interests ? interests.split(',').map(s => s.trim()) : [],
                        bio: bio || undefined,
                        portfolio: portfolio || undefined,
                        cvLink: cvLink || undefined,
                        github: github || undefined,
                        linkedin: menteeLinkedin || undefined,
                        motivation: motivation || undefined,
                        goal: goal || undefined,
                    } as any
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

const UpdateProfileSchema = z.object({
    name: z.string().min(1),
    role: z.enum(['MENTOR', 'MENTEE']),
    contactNumber: z.string().min(7).max(20),
    organization: z.string().optional(),
    jobTitle: z.string().optional(),
    graduationYear: z.coerce.number().optional(),
    linkedIn: z.string().optional(),
    expectations: z.string().optional(),
    expertise: z.string().optional(),
    preferredMentees: z.coerce.number().optional(),
    batch: z.string().optional(),
    interests: z.string().optional(),
    bio: z.string().optional(),
    portfolio: z.string().optional(),
    cvLink: z.string().optional(),
    github: z.string().optional(),
    menteeLinkedin: z.string().optional(),
    motivation: z.string().optional(),
    goal: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.role === 'MENTOR') {
        if (!data.organization) ctx.addIssue({ code: 'custom', message: 'Organization is required', path: ['organization'] });
        if (!data.jobTitle) ctx.addIssue({ code: 'custom', message: 'Job title is required', path: ['jobTitle'] });
        if (!data.linkedIn) ctx.addIssue({ code: 'custom', message: 'LinkedIn is required', path: ['linkedIn'] });
        if (!data.expertise) ctx.addIssue({ code: 'custom', message: 'Expertise is required', path: ['expertise'] });
    }
    if (data.role === 'MENTEE') {
        if (!data.batch) ctx.addIssue({ code: 'custom', message: 'Batch is required', path: ['batch'] });
        if (!data.motivation) ctx.addIssue({ code: 'custom', message: 'Motivation is required', path: ['motivation'] });
        if (!data.goal) ctx.addIssue({ code: 'custom', message: 'Goal is required', path: ['goal'] });
    }
});

export async function updateProfile(values: z.infer<typeof UpdateProfileSchema>) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: 'Not authenticated' };
    }

    const validatedFields = UpdateProfileSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: 'Invalid fields!' };
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { mentorProfile: true, menteeProfile: true }
    });

    if (!user) {
        return { error: 'User not found' };
    }

    const {
        name, role, contactNumber,
        organization, jobTitle, graduationYear, linkedIn, expectations, expertise, preferredMentees,
        batch, interests, bio, portfolio, cvLink, github, menteeLinkedin, motivation, goal
    } = validatedFields.data;

    if (role !== user.role) {
        return { error: 'Role mismatch' };
    }

    try {
        await db.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: user.id },
                data: { name }
            });

            if (role === 'MENTOR') {
                if (!user.mentorProfile) throw new Error('Mentor profile not found');
                await tx.mentorProfile.update({
                    where: { id: user.mentorProfile.id },
                    data: {
                        contactNumber,
                        organization: organization || undefined,
                        jobTitle: jobTitle || undefined,
                        graduationYear: graduationYear || undefined,
                        linkedIn: linkedIn || undefined,
                        expectations: expectations || undefined,
                        expertise: expertise ? expertise.split(',').map(s => s.trim()).filter(Boolean) : [],
                        preferredMentees: preferredMentees || 2,
                        bio: bio || undefined,
                    } as any
                });
            } else {
                if (!user.menteeProfile) throw new Error('Mentee profile not found');
                await tx.menteeProfile.update({
                    where: { id: user.menteeProfile.id },
                    data: {
                        contactNumber,
                        batch: batch || undefined,
                        interests: interests ? interests.split(',').map(s => s.trim()).filter(Boolean) : [],
                        bio: bio || undefined,
                        portfolio: portfolio || undefined,
                        cvLink: cvLink || undefined,
                        github: github || undefined,
                        linkedin: menteeLinkedin || undefined,
                        motivation: motivation || undefined,
                        goal: goal || undefined,
                    } as any
                });
            }
        });

        revalidatePath('/dashboard');
        return { success: 'Profile updated!' };
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            return { error: `Error: ${error.message}` };
        }
        return { error: 'Something went wrong!' };
    }
}
