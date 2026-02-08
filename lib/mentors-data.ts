export type AvailabilityStatus = "Available" | "Limited" | "Unavailable"

export interface Mentor {
  id: string
  name: string
  role: string
  organization: string
  graduationYear: number
  interests: string[]
  availability: AvailabilityStatus
  bio: string
  email: string
  linkedIn?: string
  jobTitle?: string
  availableSlots?: number
  capacity?: number
}

export const mentors: Mentor[] = [
  {
    id: "1",
    name: "Dr. Ashan Perera",
    role: "Senior Software Engineer",
    organization: "Google",
    graduationYear: 2015,
    interests: ["Machine Learning", "Cloud Computing", "Software Architecture"],
    availability: "Available",
    bio: "Passionate about helping students navigate their career paths in tech. With 8+ years of experience in software engineering, I can provide guidance on technical skills, career planning, and industry trends.",
    email: "ashan.p@example.com",
    linkedIn: "linkedin.com/in/ashanperera"
  },
  {
    id: "2",
    name: "Nimali Fernando",
    role: "Product Manager",
    organization: "Microsoft",
    graduationYear: 2017,
    interests: ["Product Management", "UX Design", "Agile Methodologies"],
    availability: "Limited",
    bio: "Former software developer turned product manager. I can help students understand the transition from engineering to product roles and share insights about working at top tech companies.",
    email: "nimali.f@example.com",
    linkedIn: "linkedin.com/in/nimalifernando"
  },
  {
    id: "3",
    name: "Kasun Wijeratne",
    role: "Research Scientist",
    organization: "MIT",
    graduationYear: 2012,
    interests: ["Signal Processing", "Telecommunications", "PhD Research"],
    availability: "Available",
    bio: "Currently working on cutting-edge telecommunications research. Happy to guide students interested in pursuing higher studies or research careers in academia.",
    email: "kasun.w@example.com",
    linkedIn: "linkedin.com/in/kasunwijeratne"
  },
  {
    id: "4",
    name: "Dilini Silva",
    role: "Hardware Engineer",
    organization: "Intel",
    graduationYear: 2016,
    interests: ["VLSI Design", "Embedded Systems", "IoT"],
    availability: "Available",
    bio: "Specializing in chip design and embedded systems. I can provide mentorship on hardware engineering careers and share experiences from the semiconductor industry.",
    email: "dilini.s@example.com"
  },
  {
    id: "5",
    name: "Ravindu Jayasekara",
    role: "Data Scientist",
    organization: "Amazon",
    graduationYear: 2018,
    interests: ["Data Science", "AI/ML", "Big Data Analytics"],
    availability: "Limited",
    bio: "Working on large-scale data problems at Amazon. Can help students interested in data science careers, machine learning projects, and preparing for tech interviews.",
    email: "ravindu.j@example.com",
    linkedIn: "linkedin.com/in/ravindujayasekara"
  },
  {
    id: "6",
    name: "Dr. Malini Rathnayake",
    role: "Professor",
    organization: "University of Moratuwa",
    graduationYear: 2005,
    interests: ["Control Systems", "Robotics", "Academic Research"],
    availability: "Unavailable",
    bio: "With over 15 years in academia, I guide students on research methodologies, publication strategies, and academic career paths.",
    email: "malini.r@example.com"
  },
  {
    id: "7",
    name: "Tharindu Bandara",
    role: "Startup Founder",
    organization: "TechStartup Lanka",
    graduationYear: 2014,
    interests: ["Entrepreneurship", "Startups", "Tech Innovation"],
    availability: "Available",
    bio: "Founded and scaled a tech startup from scratch. I can share insights on entrepreneurship, fundraising, and building products from idea to market.",
    email: "tharindu.b@example.com",
    linkedIn: "linkedin.com/in/tharindubandara"
  },
  {
    id: "8",
    name: "Sachini Weerasinghe",
    role: "DevOps Engineer",
    organization: "Netflix",
    graduationYear: 2019,
    interests: ["DevOps", "Cloud Infrastructure", "Automation"],
    availability: "Limited",
    bio: "Working on scalable infrastructure at Netflix. Happy to guide students on DevOps practices, cloud certifications, and modern software deployment.",
    email: "sachini.w@example.com",
    linkedIn: "linkedin.com/in/sachiniweerasinghe"
  }
]
