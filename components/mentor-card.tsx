"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Mentor, AvailabilityStatus } from "@/lib/mentors-data"
import { Building2, GraduationCap, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { selectMentor } from "@/actions/mentorship"

export interface MentorCardProps {
  mentor: Mentor
  onRequestMentorship?: (mentor: Mentor) => void // Kept for compatibility but might not be used
  animationDelay?: number
  selectionRank?: number | null
}

function getAvailabilityColor(status: AvailabilityStatus) {
  switch (status) {
    case "Available":
      return "bg-green-100 text-green-800 border-green-300"
    case "Limited":
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    case "Unavailable":
      return "bg-red-100 text-red-800 border-red-300"
  }
}

export function MentorCard({ mentor, animationDelay = 0, selectionRank }: MentorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [rank, setRank] = useState<string>("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  const handleExpand = () => setIsExpanded(!isExpanded)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const result = await selectMentor(mentor.id, parseInt(rank));

    setIsSubmitting(false)
    if (result.error) {
      setMessage({ text: result.error, type: 'error' })
    } else {
      setMessage({ text: result.success || "Saved!", type: 'success' })
      // Optional: Collapse after success?
    }
  }

  return (
    <Card
      className={cn(
        "h-full flex flex-col transition-all duration-300 border-border bg-card",
        isExpanded ? "ring-2 ring-primary shadow-2xl scale-[1.02] z-10" : "hover:shadow-xl hover:-translate-y-1",
        selectionRank ? "border-primary/50 ring-1 ring-primary/20 shadow-md" : ""
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="pb-3 cursor-pointer" onClick={handleExpand}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-lg text-card-foreground">{mentor.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground my-1">
              <span className="font-medium text-foreground">{mentor.role}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{mentor.organization}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <div className={cn("w-2 h-2 rounded-full", (mentor.availableSlots || 0) > 0 ? "bg-green-500" : "bg-red-500")} />
              <span>{mentor.availableSlots} / {mentor.capacity} Spots Left</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0", getAvailabilityColor(mentor.availability))}
          >
            {mentor.availability}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          {/* Summary badges always visible */}
          <div className="flex flex-wrap gap-2 mb-2">
            {mentor.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
            {mentor.interests.length > 3 && !isExpanded && (
              <span className="text-xs text-muted-foreground self-center">+{mentor.interests.length - 3} more</span>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="pt-4 border-t border-border animate-in fade-in-50 slide-in-from-top-2 space-y-4">
            {/* Full Bio */}
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">{mentor.bio}</p>
            </div>

            {/* Full Experience / Details */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>Batch of {mentor.graduationYear}</span>
              </div>
              {/* Add more details here if available in object */}
            </div>

            {/* Selection Form */}
            {!selectionRank ? (
              <div className="bg-muted/50 p-4 rounded-xl border border-border mt-4">
                <h4 className="font-semibold text-sm mb-3">Add to Preferences</h4>
                {message && (
                  <div className={cn("p-2 text-xs rounded mb-3", message.type === 'error' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                    {message.text}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`rank-${mentor.id}`} className="text-xs">Priority Rank</Label>
                    <Select value={rank} onValueChange={setRank}>
                      <SelectTrigger id={`rank-${mentor.id}`} className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st (Highest)</SelectItem>
                        <SelectItem value="2">2nd</SelectItem>
                        <SelectItem value="3">3rd</SelectItem>
                        <SelectItem value="4">4th</SelectItem>
                        <SelectItem value="5">5th</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" className="w-full" disabled={isSubmitting || mentor.availability === "Unavailable"}>
                    {isSubmitting ? "Saving..." : "Save Preference"}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {selectionRank}
                </span>
                <div className="text-sm">
                  <p className="font-medium text-primary">Selected as #{selectionRank}</p>
                  <p className="text-muted-foreground text-xs">Go to dashboard to edit</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {!isExpanded && (
          <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={handleExpand}>
            <ChevronDown className="h-4 w-4 mr-2" />
            View Details & Select
          </Button>
        )}
        {isExpanded && (
          <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={handleExpand}>
            <ChevronUp className="h-4 w-4 mr-2" />
            Show Less
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
