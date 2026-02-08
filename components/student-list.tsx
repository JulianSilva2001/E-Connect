"use client"

import React, { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X } from "lucide-react"
import { allStudents, allInterests, type Student } from "@/lib/students-data"

export function StudentList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedBatches, setSelectedBatches] = useState<string[]>([])
  const [expandedBatch, setExpandedBatch] = useState<string | null>("21st")

  const batches = ["21st", "22nd", "23rd", "24th"]

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      const matchesSearch =
        searchTerm === "" ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.interests.some((interest) =>
          interest.toLowerCase().includes(searchTerm.toLowerCase())
        )

      const matchesBatch = selectedBatches.length === 0 || selectedBatches.includes(student.batch)

      const matchesInterests =
        selectedInterests.length === 0 ||
        student.interests.some((interest) => selectedInterests.includes(interest))

      return matchesSearch && matchesBatch && matchesInterests
    })
  }, [searchTerm, selectedInterests, selectedBatches])

  // Group filtered students by batch
  const studentsByBatch = useMemo(() => {
    const grouped: Record<string, Student[]> = {}
    batches.forEach((batch) => {
      grouped[batch] = filteredStudents.filter((s) => s.batch === batch)
    })
    return grouped
  }, [filteredStudents])

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const toggleBatch = (batch: string) => {
    setSelectedBatches((prev) =>
      prev.includes(batch) ? prev.filter((b) => b !== batch) : [...prev, batch]
    )
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedInterests([])
    setSelectedBatches([])
  }

  const hasActiveFilters = searchTerm || selectedInterests.length > 0 || selectedBatches.length > 0

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by student name or interest..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 py-3 text-base"
        />
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg p-6 border border-border sticky top-20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-foreground">Filters</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-accent hover:text-accent hover:bg-accent/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Batch Filter */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-foreground mb-3">Batch</h4>
              <div className="space-y-2">
                {batches.map((batch) => (
                  <div key={batch} className="flex items-center">
                    <Checkbox
                      id={`batch-${batch}`}
                      checked={selectedBatches.includes(batch)}
                      onCheckedChange={() => toggleBatch(batch)}
                    />
                    <Label htmlFor={`batch-${batch}`} className="ml-2 text-sm cursor-pointer">
                      {batch} Batch ({studentsByBatch[batch].length})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Interest Filter */}
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Interests</h4>
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {allInterests.map((interest) => (
                    <div key={interest} className="flex items-center">
                      <Checkbox
                        id={`interest-${interest}`}
                        checked={selectedInterests.includes(interest)}
                        onCheckedChange={() => toggleInterest(interest)}
                      />
                      <Label
                        htmlFor={`interest-${interest}`}
                        className="ml-2 text-sm cursor-pointer"
                      >
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="lg:col-span-3">
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="text-sm py-1.5 px-3">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-2 hover:text-foreground"
                  >
                    ✕
                  </button>
                </Badge>
              )}
              {selectedBatches.map((batch) => (
                <Badge key={batch} variant="secondary" className="text-sm py-1.5 px-3">
                  {batch} Batch
                  <button
                    onClick={() => toggleBatch(batch)}
                    className="ml-2 hover:text-foreground"
                  >
                    ✕
                  </button>
                </Badge>
              ))}
              {selectedInterests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-sm py-1.5 px-3">
                  {interest}
                  <button
                    onClick={() => toggleInterest(interest)}
                    className="ml-2 hover:text-foreground"
                  >
                    ✕
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredStudents.length}</span> student
              {filteredStudents.length !== 1 ? "s" : ""} out of{" "}
              <span className="font-semibold text-foreground">{allStudents.length}</span>
            </p>
          </div>

          {/* Students by Batch */}
          <div className="space-y-6">
            {batches.map((batch) => (
              <div key={batch}>
                <button
                  onClick={() =>
                    setExpandedBatch(expandedBatch === batch ? null : batch)
                  }
                  className="w-full flex items-center justify-between p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mb-3"
                >
                  <h3 className="text-lg font-semibold">{batch} Batch</h3>
                  <span className="text-sm bg-primary-foreground/20 px-3 py-1 rounded-full">
                    {studentsByBatch[batch].length} students
                  </span>
                </button>

                {expandedBatch === batch && studentsByBatch[batch].length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studentsByBatch[batch].map((student) => (
                      <div
                        key={student.id}
                        className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <h4 className="font-semibold text-foreground mb-2">{student.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Year: <span className="font-medium text-foreground">{student.year}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {student.interests.map((interest) => (
                            <Badge
                              key={interest}
                              variant="outline"
                              className="text-xs py-1 px-2"
                            >
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {expandedBatch === batch && studentsByBatch[batch].length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No students found in {batch} batch</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No students found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
