
"use client"

import { useState, useMemo } from "react"
import { MentorCard } from "@/components/mentor-card"
import { Mentor, AvailabilityStatus } from "@/lib/mentors-data"
import { Search, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const availabilityFilters: AvailabilityStatus[] = ["Available", "Limited", "Unavailable"]

interface MentorBrowserProps {
    initialMentors: Mentor[]
    selections?: { mentorId: string; rank: number }[]
}

export function MentorBrowser({ initialMentors, selections = [] }: MentorBrowserProps) {
    const [mentors] = useState<Mentor[]>(initialMentors)

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityStatus | null>(null)
    const [selectedInterest, setSelectedInterest] = useState<string | null>(null)

    // Helper to get rank
    const getSelectionRank = (mentorId: string) => {
        const selection = selections.find(s => s.mentorId === mentorId);
        return selection ? selection.rank : null;
    }

    const allInterests = useMemo(() => Array.from(
        new Set(mentors.flatMap(m => m.interests))
    ).sort(), [mentors])

    const filteredMentors = useMemo(() => {
        return mentors.filter(mentor => {
            // Search filter
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch = searchQuery === "" ||
                mentor.name.toLowerCase().includes(searchLower) ||
                mentor.role.toLowerCase().includes(searchLower) ||
                mentor.organization.toLowerCase().includes(searchLower) ||
                mentor.interests.some(i => i.toLowerCase().includes(searchLower))

            // Availability filter
            const matchesAvailability = !selectedAvailability ||
                mentor.availability === selectedAvailability

            // Interest filter
            const matchesInterest = !selectedInterest ||
                mentor.interests.includes(selectedInterest)

            return matchesSearch && matchesAvailability && matchesInterest
        })
    }, [mentors, searchQuery, selectedAvailability, selectedInterest])

    const clearFilters = () => {
        setSearchQuery("")
        setSelectedAvailability(null)
        setSelectedInterest(null)
    }

    const hasActiveFilters = searchQuery || selectedAvailability || selectedInterest

    return (
        <>
            {/* Search and Filter Section ... */}
            <section className="py-8 bg-background border-b border-border sticky top-16 z-40">
                {/* Same JSX */}
                <div className="container mx-auto px-4">
                    {/* Search Bar */}
                    <div className="relative max-w-xl mx-auto mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by name, role, organization, or interests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-4 py-3 text-base bg-card"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {/* Filters... */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                        {/* Availability Filters */}
                        <div className="flex flex-wrap gap-2 items-center justify-center">
                            <span className="text-sm font-medium text-muted-foreground mr-2">
                                <Filter className="h-4 w-4 inline mr-1" />
                                Availability:
                            </span>
                            {availabilityFilters.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedAvailability(
                                        selectedAvailability === status ? null : status
                                    )}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                        selectedAvailability === status
                                            ? status === "Available"
                                                ? "bg-green-500 text-white"
                                                : status === "Limited"
                                                    ? "bg-yellow-500 text-white"
                                                    : "bg-red-500 text-white"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Interest Filter Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Domain:</span>
                            <select
                                value={selectedInterest || ""}
                                onChange={(e) => setSelectedInterest(e.target.value || null)}
                                className="px-4 py-2 rounded-lg text-sm bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All Domains</option>
                                {allInterests.map((interest) => (
                                    <option key={interest} value={interest}>
                                        {interest}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                className="gap-2 bg-transparent"
                            >
                                <X className="h-4 w-4" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            {/* Mentors Grid */}
            <section className="py-12 bg-muted">
                <div className="container mx-auto px-4">
                    {/* Results Count */}
                    <p className="text-muted-foreground mb-6">
                        Showing {filteredMentors.length} of {mentors.length} mentors
                        {hasActiveFilters && " (filtered)"}
                    </p>

                    {filteredMentors.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                            {filteredMentors.map((mentor, index) => (
                                <MentorCard
                                    key={mentor.id}
                                    mentor={mentor}
                                    animationDelay={index * 100}
                                    selectionRank={getSelectionRank(mentor.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="bg-muted-foreground/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                <Search className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">No mentors found</h3>
                            <p className="text-muted-foreground mb-6">
                                Try adjusting your search or filters to find more mentors.
                            </p>
                            <Button onClick={clearFilters} variant="outline">
                                Clear All Filters
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </>
    )
}
