"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateProfile } from "@/actions/auth";
import { getMenteeWordCountMessage, hasMinimumMenteeWordCount } from "@/lib/mentee-text-validation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ProfileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    role: z.enum(["MENTOR", "MENTEE"]),
    contactNumber: z.string().min(7, "Contact number is required").max(20, "Contact number is too long"),
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
    if (data.role === "MENTOR") {
        if (!data.organization) ctx.addIssue({ code: "custom", path: ["organization"], message: "Organization is required" });
        if (!data.jobTitle) ctx.addIssue({ code: "custom", path: ["jobTitle"], message: "Job title is required" });
        if (!data.linkedIn) ctx.addIssue({ code: "custom", path: ["linkedIn"], message: "LinkedIn is required" });
        if (!data.expertise) ctx.addIssue({ code: "custom", path: ["expertise"], message: "Expertise is required" });
    }
    if (data.role === "MENTEE") {
        if (!data.batch) ctx.addIssue({ code: "custom", path: ["batch"], message: "Batch is required" });
        if (!data.bio) ctx.addIssue({ code: "custom", path: ["bio"], message: "About yourself is required" });
        if (!data.motivation) ctx.addIssue({ code: "custom", path: ["motivation"], message: "Motivation is required" });
        if (!data.goal) ctx.addIssue({ code: "custom", path: ["goal"], message: "Goal is required" });

        if (data.bio && !hasMinimumMenteeWordCount(data.bio)) {
            ctx.addIssue({ code: "custom", path: ["bio"], message: getMenteeWordCountMessage("About yourself") });
        }
        if (data.motivation && !hasMinimumMenteeWordCount(data.motivation)) {
            ctx.addIssue({ code: "custom", path: ["motivation"], message: getMenteeWordCountMessage("Why do you need a mentor?") });
        }
        if (data.goal && !hasMinimumMenteeWordCount(data.goal)) {
            ctx.addIssue({ code: "custom", path: ["goal"], message: getMenteeWordCountMessage("What is your goal?") });
        }
    }
});

type ProfileValues = z.infer<typeof ProfileSchema>;

export function ProfileEditor({ initialValues }: { initialValues: ProfileValues }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const form = useForm<ProfileValues>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: initialValues,
    });
    const role = form.watch("role");

    const onSubmit = (values: ProfileValues) => {
        setError("");
        setSuccess("");
        startTransition(() => {
            updateProfile(values).then((data) => {
                setError(data.error);
                setSuccess(data.success);
            });
        });
    };

    return (
        <div className="bg-white rounded-2xl border shadow-sm p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                <p className="text-muted-foreground mt-2">Update your profile information without creating a new account.</p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input disabled={isPending} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Number</FormLabel>
                                    <FormControl>
                                        <Input disabled={isPending} placeholder="+94 77 123 4567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {role === "MENTOR" ? (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <ProfileInput form={form} name="jobTitle" label="Job Title" disabled={isPending} />
                                <ProfileInput form={form} name="organization" label="Organization" disabled={isPending} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="graduationYear"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Graduation Year</FormLabel>
                                            <FormControl>
                                                <Input
                                                    disabled={isPending}
                                                    type="number"
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                                />
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
                                            <FormLabel>Mentee Capacity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    disabled={isPending}
                                                    type="number"
                                                    min={1}
                                                    max={10}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <ProfileInput form={form} name="linkedIn" label="LinkedIn URL" disabled={isPending} />
                            <ProfileInput form={form} name="expertise" label="Expertise" disabled={isPending} />
                            <ProfileTextarea form={form} name="bio" label="Bio" disabled={isPending} />
                            <ProfileTextarea form={form} name="expectations" label="Expectations from Mentees" disabled={isPending} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <ProfileInput form={form} name="batch" label="Batch" disabled={isPending} />
                                <ProfileInput form={form} name="interests" label="Areas of Interest" disabled={isPending} />
                            </div>
                            <ProfileTextarea form={form} name="bio" label="About Yourself" disabled={isPending} />
                            <div className="grid md:grid-cols-2 gap-4">
                                <ProfileTextarea form={form} name="motivation" label="Why do you need a mentor?" disabled={isPending} />
                                <ProfileTextarea form={form} name="goal" label="What is your goal?" disabled={isPending} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <ProfileInput form={form} name="menteeLinkedin" label="LinkedIn URL" disabled={isPending} />
                                <ProfileInput form={form} name="github" label="GitHub URL" disabled={isPending} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <ProfileInput form={form} name="portfolio" label="Portfolio URL" disabled={isPending} />
                                <ProfileInput form={form} name="cvLink" label="CV Link" disabled={isPending} />
                            </div>
                        </div>
                    )}

                    {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded border border-red-200">{error}</div>}
                    {success && <div className="p-3 text-sm text-green-500 bg-green-100 rounded border border-green-200">{success}</div>}

                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </form>
            </Form>
        </div>
    );
}

function ProfileInput({ form, name, label, disabled }: { form: any; name: string; label: string; disabled: boolean }) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input disabled={disabled} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function ProfileTextarea({ form, name, label, disabled }: { form: any; name: string; label: string; disabled: boolean }) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Textarea disabled={disabled} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
