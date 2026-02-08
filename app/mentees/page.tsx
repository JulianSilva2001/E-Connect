
import { getMentors } from "@/actions/mentorship"; // Need to ensure this is exported from actions
import { MentorBrowser } from "@/components/mentor-browser";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

// We need to match the Shape of Mentor type expected by MentorBrowser
// The getMentors action returns an array of objects that should match.

export default async function MenteesPage() {
  const mentors = await getMentors();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-secondary to-primary py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 text-balance">
                Find Your Mentor
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/90 mb-8">
                Browse our community of experienced mentors and find the perfect match for your academic and career goals.
                Select your top 5 preferences to get matched.
              </p>
            </div>
          </div>
        </section>

        <MentorBrowser initialMentors={mentors as any} />
        {/* Type casting for now if mismatch, but ideally align types */}
      </main>

      <Footer />
    </div>
  )
}
