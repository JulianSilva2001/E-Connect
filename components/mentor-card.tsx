"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Mentor, AvailabilityStatus } from "@/lib/mentors-data"
import { Building2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MentorCardProps {
  mentor: Mentor
  onOpenDetails?: (mentor: Mentor) => void
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

export function MentorCard({ mentor, onOpenDetails, animationDelay = 0, selectionRank }: MentorCardProps) {
  return (
    <Card
      className={cn(
        "h-full flex flex-col transition-all duration-300 border-border bg-card",
        "hover:shadow-xl hover:-translate-y-1",
        selectionRank ? "border-primary/50 ring-1 ring-primary/20 shadow-md" : ""
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-lg text-card-foreground">{mentor.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground my-1">
              <span className="font-medium text-foreground">{mentor.jobTitle || mentor.role}</span>
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
          <div className="flex flex-wrap gap-2 mb-2 min-w-0">
            {mentor.interests.slice(0, 3).map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="max-w-full whitespace-normal break-words text-xs h-auto py-1 leading-snug"
              >
                {interest}
              </Badge>
            ))}
            {mentor.interests.length > 3 && (
              <span className="text-xs text-muted-foreground self-center">+{mentor.interests.length - 3} more</span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">{mentor.bio}</p>
        {selectionRank ? (
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
              {selectionRank}
            </span>
            <div className="text-sm">
              <p className="font-medium text-primary">Selected as #{selectionRank}</p>
              <p className="text-muted-foreground text-xs">Set the order from the top panel</p>
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="pt-0">
        <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={() => onOpenDetails?.(mentor)}>
          <Eye className="h-4 w-4 mr-2" />
          View Profile
        </Button>
      </CardFooter>
    </Card>
  )
}
