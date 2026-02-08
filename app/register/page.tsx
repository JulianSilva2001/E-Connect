
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { register } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter } from 'next/navigation';

// Match the schema in actions/auth.ts
const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(1, "Name is required"),
    role: z.enum(['MENTOR', 'MENTEE']),

    // Mentor Fields
    organization: z.string().optional(),
    jobTitle: z.string().optional(),
    graduationYear: z.string().optional(), // Input as string, coerced in backend
    linkedIn: z.string().optional(),
    expectations: z.string().optional(),
    expertise: z.string().optional(),
    preferredMentees: z.coerce.number().optional(),

    // Mentee Fields
    batch: z.string().optional(),
    interests: z.string().optional(),
    bio: z.string().optional(),
    portfolio: z.string().optional(),
    cvLink: z.string().optional(),
    github: z.string().optional(),
    menteeLinkedin: z.string().optional(),
    motivation: z.string().optional(),
    goal: z.string().optional(),
}).refine((data) => {
    // Custom validation
    if (data.role === 'MENTOR') {
        return !!data.organization && !!data.jobTitle && !!data.linkedIn && !!data.expertise;
    }
    if (data.role === 'MENTEE') {
        return !!data.batch && !!data.motivation && !!data.goal;
    }
    return true;
}, {
    message: "Creating a profile requires filling all required fields.",
    path: ["role"], // Attach error to role just to show somewhere if generic
});

export default function RegisterPage() {
    const [error, setError] = useState<string | undefined>('');
    const [success, setSuccess] = useState<string | undefined>('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            email: '',
            password: '',
            name: '',
            role: 'MENTEE',
            organization: '',
            jobTitle: '',
            graduationYear: '',
            linkedIn: '',
            expectations: '',
            expertise: '',
            preferredMentees: 2, // default number
            batch: '',
            interests: '',
            bio: '',
            portfolio: '',
            cvLink: '',
            github: '',
            menteeLinkedin: '',
            motivation: '',
            goal: '',
        },
    });

    const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
        setError('');
        setSuccess('');

        startTransition(() => {
            register(values).then((data) => {
                setError(data.error);
                setSuccess(data.success);
                if (data.success) {
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                }
            });
        });
    };

    const role = form.watch("role");

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50 py-12">
            <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-xl shadow-lg border">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Account</h1>
                    <p className="text-muted-foreground mt-2">Join the ENTC Mentorship Community</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Basic Info */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input disabled={isPending} placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input disabled={isPending} placeholder="john@example.com" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input disabled={isPending} placeholder="******" type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>I am a...</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="MENTEE">Mentee (Student)</SelectItem>
                                                <SelectItem value="MENTOR">Mentor (Alumni/Senior)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border-t pt-6">
                            {role === 'MENTOR' && (
                                <div className="space-y-4 animate-in fade-in-50 slide-in-from-top-2">
                                    <h3 className="font-semibold text-lg">Mentor Profile</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="jobTitle"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Job Title *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Senior Software Engineer" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="organization"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Organization *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Google" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="graduationYear"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Graduation Year (Batch)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="2015" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="linkedIn"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>LinkedIn Profile URL *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://linkedin.com/in/..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="expertise"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primary Interests / Expertise *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="AI, Embedded Systems, Career Guidance (comma separated)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="expectations"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expectations from Mentee</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="What do you expect from your mentees? (e.g., commitment, proactive communication)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="preferredMentees"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Preferred Mentee Capacity (Slots)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={1} max={10} placeholder="2" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {role === 'MENTEE' && (
                                <div className="space-y-4 animate-in fade-in-50 slide-in-from-top-2">
                                    <h3 className="font-semibold text-lg">Student Details</h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="batch"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Batch *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Batch 19" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="interests"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Areas of Interest</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Robotics, AI, etc." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="bio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>About Yourself</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Brief introduction..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="motivation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Why do you need a mentor? *</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Explain your motivation..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="goal"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>What is your goal? *</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Career or academic goals..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <h4 className="font-medium text-sm text-muted-foreground mt-4">Links & Portfolio</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="menteeLinkedin"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>LinkedIn URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://linkedin.com/in/..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="github"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>GitHub URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://github.com/..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="portfolio"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Portfolio URL (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="cvLink"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CV Link (Google Drive)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://drive.google.com/..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded border border-red-200">{error}</div>}
                        {success && <div className="p-3 text-sm text-green-500 bg-green-100 rounded border border-green-200">{success}</div>}

                        <Button type="submit" className="w-full h-11 text-base" disabled={isPending}>
                            {isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>
                </Form>
                <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <a href="/login" className="text-primary hover:underline font-medium">Login</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
