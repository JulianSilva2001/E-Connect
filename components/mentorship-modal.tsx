
"use client"

import React, { useState, useEffect } from "react"
import { Building2, Mail, Linkedin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mentor, AvailabilityStatus } from "@/lib/mentors-data"
import { cn } from "@/lib/utils"

interface MentorshipModalProps {
  mentor: Mentor | null
  isOpen: boolean
  onClose: () => void
  selectionRank?: number | null
  preferencesLocked?: boolean
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

export function MentorshipModal({ mentor, isOpen, onClose, selectionRank, preferencesLocked = false }: MentorshipModalProps) {
  const linkedInUrl = mentor?.linkedIn
    ? mentor.linkedIn.startsWith("http")
      ? mentor.linkedIn
      : `https://${mentor.linkedIn}`
    : null

  if (!isOpen || !mentor) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="max-h-[85vh] overflow-y-auto p-6 md:p-8">
          {/* Header Section */}
          <div className="mb-6 pb-6 border-b border-border">
            <DialogHeader className="mb-4 text-left">
              <DialogTitle className="text-2xl font-bold text-card-foreground">
                {mentor.name}
              </DialogTitle>
              <DialogDescription className="text-base">
                {mentor.jobTitle || mentor.role}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <Badge variant="outline" className={cn("shrink-0", getAvailabilityColor(mentor.availability))}>
                {mentor.availability}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{mentor.organization}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{mentor.bio}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {mentor.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="max-w-full whitespace-normal break-words text-xs h-auto py-1 leading-snug"
                >
                  {interest}
                </Badge>
              ))}
            </div>
            {mentor.expectations && (
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Mentor Expectations
                </p>
                <p className="text-sm text-foreground/90">{mentor.expectations}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <a href={`mailto:${mentor.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                <Mail className="h-4 w-4" />
                Contact
              </a>
              {linkedInUrl && (
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Preference Selection</h3>
            <p className="text-sm text-muted-foreground">
              Review mentor details here, then use the preference panel at the top of the page to search by mentor name and set your preference order.
            </p>
            {selectionRank ? (
              <div className="mt-4 bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {selectionRank}
                </span>
                <div className="text-sm">
                  <p className="font-medium text-primary">Already in your preference list</p>
                  <p className="text-muted-foreground text-xs">
                    {preferencesLocked ? "Preference order is locked" : "Change the order from the top preference panel"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
