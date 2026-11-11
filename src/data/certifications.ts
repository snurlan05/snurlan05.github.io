// Microsoft certifications, verified against the certificate PDFs in
// ~/workspace/user/files/ (Azure_Fundamentals.pdf, Azure_AI_Fundamentals.pdf).
//
// Titles and issue dates below are copied from those PDFs. The PDFs also
// carry Certiport verification codes; those codes are deliberately NOT
// stored here and are never published on the site.

export interface Certification {
  /** Full title as printed on the certificate. */
  title: string;
  /** Exam code, e.g. AZ-900. Public exam identifier, safe to show. */
  examCode: string;
  issuer: string;
  /** Date printed on the certificate. */
  issued: string;
  /** Short description of what the exam covers (Microsoft's published scope). */
  covers: string;
  skills: string[];
}

export const certifications: Certification[] = [
  {
    title: "Microsoft Certified: Azure Fundamentals",
    examCode: "AZ-900",
    issuer: "Microsoft",
    issued: "June 18, 2026",
    covers:
      "Cloud concepts, Azure architecture and services, and Azure management and governance.",
    skills: ["Cloud concepts", "Azure services", "Azure management & governance"],
  },
  {
    title: "Microsoft Certified: Azure AI Fundamentals",
    examCode: "AI-900",
    issuer: "Microsoft",
    issued: "June 29, 2026",
    covers:
      "AI workloads and considerations, machine learning principles, and Azure AI services including computer vision, natural language processing, and generative AI.",
    skills: [
      "AI workloads",
      "Machine learning principles",
      "Azure AI services",
      "Generative AI",
    ],
  },
];
