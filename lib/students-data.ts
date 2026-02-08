export interface Student {
  id: string
  name: string
  batch: "21st" | "22nd" | "23rd" | "24th"
  interests: string[]
  year: number
}

export const allStudents: Student[] = [
  // 21st Batch
  { id: "s1", name: "John Doe", batch: "21st", interests: ["Embedded Systems", "IoT"], year: 3 },
  { id: "s2", name: "Sarah Anderson", batch: "21st", interests: ["AI", "Machine Learning"], year: 3 },
  { id: "s3", name: "Michael Chen", batch: "21st", interests: ["VLSI", "Electronics"], year: 3 },
  { id: "s4", name: "Emma Wilson", batch: "21st", interests: ["Signal Processing", "DSP"], year: 3 },
  { id: "s5", name: "David Kumar", batch: "21st", interests: ["Telecom", "5G"], year: 3 },
  { id: "s6", name: "Lisa Johnson", batch: "21st", interests: ["Embedded Systems", "AI"], year: 3 },
  { id: "s7", name: "James Martinez", batch: "21st", interests: ["IoT", "Embedded Systems"], year: 3 },
  { id: "s8", name: "Rachel Green", batch: "21st", interests: ["Signal Processing", "Audio"], year: 3 },
  { id: "s9", name: "Kevin Brown", batch: "21st", interests: ["Telecom", "Networking"], year: 3 },
  { id: "s10", name: "Angela Davis", batch: "21st", interests: ["Machine Learning", "AI"], year: 3 },

  // 22nd Batch
  { id: "s11", name: "Jane Smith", batch: "22nd", interests: ["AI", "Machine Learning"], year: 2 },
  { id: "s12", name: "Robert Taylor", batch: "22nd", interests: ["Embedded Systems", "Firmware"], year: 2 },
  { id: "s13", name: "Maria Garcia", batch: "22nd", interests: ["VLSI", "Design"], year: 2 },
  { id: "s14", name: "Chris Lee", batch: "22nd", interests: ["Signal Processing", "FFT"], year: 2 },
  { id: "s15", name: "Jessica White", batch: "22nd", interests: ["Telecom", "Wireless"], year: 2 },
  { id: "s16", name: "Daniel Harris", batch: "22nd", interests: ["IoT", "Sensors"], year: 2 },
  { id: "s17", name: "Nicole Martin", batch: "22nd", interests: ["Machine Learning", "Deep Learning"], year: 2 },
  { id: "s18", name: "Brandon Jones", batch: "22nd", interests: ["Embedded Systems", "Real-time Systems"], year: 2 },
  { id: "s19", name: "Victoria Clark", batch: "22nd", interests: ["VLSI", "Electronics"], year: 2 },
  { id: "s20", name: "Alexander Robinson", batch: "22nd", interests: ["AI", "Robotics"], year: 2 },

  // 23rd Batch
  { id: "s21", name: "Emily Johnson", batch: "23rd", interests: ["VLSI", "Electronics"], year: 1 },
  { id: "s22", name: "Mark Wilson", batch: "23rd", interests: ["Signal Processing", "AI"], year: 1 },
  { id: "s23", name: "Sophia Moore", batch: "23rd", interests: ["Machine Learning", "Data Science"], year: 1 },
  { id: "s24", name: "Daniel Thomas", batch: "23rd", interests: ["Embedded Systems", "Microcontrollers"], year: 1 },
  { id: "s25", name: "Olivia Jackson", batch: "23rd", interests: ["Telecom", "5G Networks"], year: 1 },
  { id: "s26", name: "Jacob White", batch: "23rd", interests: ["IoT", "Arduino"], year: 1 },
  { id: "s27", name: "Isabella Harris", batch: "23rd", interests: ["AI", "Neural Networks"], year: 1 },
  { id: "s28", name: "Mason Martin", batch: "23rd", interests: ["VLSI", "Semiconductor Design"], year: 1 },
  { id: "s29", name: "Mia Thompson", batch: "23rd", interests: ["Signal Processing", "DSP"], year: 1 },
  { id: "s30", name: "Ethan Garcia", batch: "23rd", interests: ["Embedded Systems", "IoT"], year: 1 },

  // 24th Batch
  { id: "s31", name: "Ava Rodriguez", batch: "24th", interests: ["Machine Learning", "AI"], year: 4 },
  { id: "s32", name: "Lucas Lee", batch: "24th", interests: ["Telecom", "Communication Systems"], year: 4 },
  { id: "s33", name: "Charlotte Taylor", batch: "24th", interests: ["VLSI", "Circuit Design"], year: 4 },
  { id: "s34", name: "Benjamin Anderson", batch: "24th", interests: ["Signal Processing", "Audio Processing"], year: 4 },
  { id: "s35", name: "Amelia Thomas", batch: "24th", interests: ["Embedded Systems", "Firmware Development"], year: 4 },
  { id: "s36", name: "Mason Jackson", batch: "24th", interests: ["IoT", "Smart Devices"], year: 4 },
  { id: "s37", name: "Harper White", batch: "24th", interests: ["AI", "Computer Vision"], year: 4 },
  { id: "s38", name: "Logan Harris", batch: "24th", interests: ["Machine Learning", "Predictive Analytics"], year: 4 },
  { id: "s39", name: "Evelyn Martin", batch: "24th", interests: ["Telecom", "Network Security"], year: 4 },
  { id: "s40", name: "Jackson Thompson", batch: "24th", interests: ["VLSI", "Power Optimization"], year: 4 },
]

export const allInterests = [
  "AI",
  "Machine Learning",
  "Embedded Systems",
  "IoT",
  "VLSI",
  "Signal Processing",
  "Telecom",
  "Wireless",
  "5G",
  "Networking",
  "Deep Learning",
  "Computer Vision",
  "Audio Processing",
  "DSP",
  "Sensors",
  "Arduino",
  "Microcontrollers",
  "Firmware",
  "Real-time Systems",
  "Data Science",
]
