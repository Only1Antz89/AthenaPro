import { env } from "@/lib/env";

type ContentSection = {
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
};

export const SITE_CONTACT = {
  supportEmail: "contact@athenapro.co.uk",
  privacyEmail: "privacy@athenapro.co.uk",
  websiteUrl: "https://www.athenapro.co.uk",
  registeredOffice: env.registeredOffice || "Registered office details to be inserted before public launch.",
  companyRegistration: env.companyRegistration || "Company registration details to be inserted before public launch.",
  registrationNote:
    "This preview still requires the client’s final registered office and company registration details before publication."
} as const;

export const HOME_METRICS = [
  {
    label: "Onsite + technical split",
    value: "50 / 50",
    detail: "Ticketing technology and field execution held in the same operating layer."
  },
  {
    label: "Operational promise",
    value: "Gate ready",
    detail: "Built for venues, promoters, agencies, and event partners who need quiet precision."
  },
  {
    label: "Commercial lens",
    value: "Revenue aware",
    detail: "Every staffing and ticketing decision is measured against throughput and control."
  },
  {
    label: "Delivery culture",
    value: "No drift",
    detail: "Disciplined people, resilient workflows, and clear reporting from ingress to close."
  }
] as const;

export const HOME_PROOF_POINTS = [
  {
    title: "Ticketing logic that survives the live environment",
    body:
      "Scanner integration, access control alignment, device troubleshooting, and onsite network stability managed as one operating system."
  },
  {
    title: "Field teams selected for composure, not availability alone",
    body:
      "Athena Pro places disciplined frontline operators, supervisors, and support staff where accuracy and pace matter most."
  },
  {
    title: "Commercial oversight embedded into delivery",
    body:
      "We track throughput, audit exceptions, and keep the operating picture commercially coherent while the event is live."
  }
] as const;

export const SERVICE_PILLARS = [
  {
    key: "ticketing-and-tech-support",
    title: "Ticketing & Tech Support",
    ratio: "50%",
    summary:
      "The logic behind the gate: scanners, devices, connectivity, access flows, and the quiet support layer that keeps ingress stable.",
    bullets: [
      "Advanced gate logic and access control mapping",
      "Scanner integration and device readiness",
      "Onsite network stability and troubleshooting",
      "Incident response for handhelds, printers, and validation hardware",
      "Data auditing and reconciliation support"
    ]
  },
  {
    key: "personnel-and-operations",
    title: "Personnel & Operations",
    ratio: "50%",
    summary:
      "Frontline execution with discipline: vetted field teams, onsite supervisors, and crowd-facing operators selected for pace, accuracy, and control.",
    bullets: [
      "Elite onsite staffing for ingress, accreditation, and customer touchpoints",
      "Supervisor-level management and escalation control",
      "Crowd flow logistics and frontline coordination",
      "Deployment oversight through live event delivery",
      "Availability, standing, and performance visibility through the platform"
    ]
  },
  {
    key: "commercial-management",
    title: "Commercial Management",
    ratio: "Strategic Layer",
    summary:
      "Oversight for revenue, controls, and commercial clarity when event operations carry financial risk.",
    bullets: [
      "Revenue optimisation across access and delivery operations",
      "Consulting for operational design and recovery planning",
      "Financial auditing and exception review",
      "Event commercial oversight for promoters, agencies, and rights holders"
    ]
  }
] as const;

export const ABOUT_CONTENT = {
  eyebrow: "Athena Philosophy",
  title: "Strategic wisdom combined with technical craft.",
  intro: [
    "Athena Pro was shaped around a simple belief: live event operations should be directed with the same precision as the systems that sit behind them.",
    "We operate where ticketing infrastructure, onsite staffing, and commercial intelligence meet, giving companies a controlled way to manage access, people, and performance under live conditions."
  ],
  sections: [
    {
      title: "What Athena Pro Is",
      paragraphs: [
        "Athena Pro is not a temp agency. It is an operational partner built for promoters, venues, agencies, and event owners who need a disciplined delivery layer at the gate and on the ground."
      ],
      bullets: [
        "Technical precision under live pressure",
        "Elite personnel with clear operational standards",
        "Commercial awareness built into onsite decisions"
      ]
    },
    {
      title: "How We Think",
      paragraphs: [
        "Strategic wisdom matters only when it survives execution. Our model joins planning, system logic, and frontline behaviour so decisions do not fracture when the crowd arrives."
      ]
    },
    {
      title: "What Companies Get",
      bullets: [
        "A partner fluent in ticketing operations and onsite delivery",
        "Clearer accountability between technical and field teams",
        "A platform layer for jobs, standing, and delivery visibility"
      ]
    }
  ] satisfies readonly ContentSection[]
} as const;

export const CONTACT_EVENT_TYPES = [
  "Festival",
  "Arena show",
  "Stadium event",
  "Conference",
  "Brand activation",
  "Venue operations",
  "Other"
] as const;

export const CONTACT_SERVICE_NEEDS = [
  "Ticketing & Tech Support",
  "Personnel & Operations",
  "Commercial Management",
  "Integrated full-service support"
] as const;

export const TERMS_CONTENT: readonly ContentSection[] = [
  {
    title: "About Us",
    paragraphs: [
      `Athena Pro operates the website at ${SITE_CONTACT.websiteUrl}.`,
      "This preview assumes a UK launch. Insert the final legal entity name, company number, and registered office before publication."
    ],
    bullets: [
      "Registered business name: Athena Pro",
      `Registered office: ${SITE_CONTACT.registeredOffice}`,
      `Email: ${SITE_CONTACT.supportEmail}`
    ]
  },
  {
    title: "Our Services",
    paragraphs: [
      "Athena Pro provides operational support for ticketing technology, onsite personnel, job management, and related event delivery services.",
      "Services may be updated, improved, suspended, or withdrawn where reasonably necessary."
    ]
  },
  {
    title: "Eligibility",
    bullets: [
      "Users must be at least 18 years old",
      "Information provided must be accurate and not misleading",
      "Anyone acting for a company or organisation must have authority to do so"
    ]
  },
  {
    title: "Company Accounts and Jobs",
    bullets: [
      "Jobs and event briefs must be lawful, accurate, and not misleading",
      "Deployment requirements, rates, schedules, and expectations should be clearly stated where possible",
      "Content must not discriminate unlawfully under UK law",
      "Content must not contain false claims, scams, malware, or inappropriate material"
    ],
    paragraphs: [
      "Athena Pro may reject, edit, suspend, or remove any listing or account reasonably believed to breach these terms or harm users, the platform, or its reputation."
    ]
  },
  {
    title: "Field Team Use",
    paragraphs: [
      "Users seeking deployment through the platform must ensure that profiles, experience signals, availability, and submitted information are accurate and current.",
      "Athena Pro does not guarantee a deployment, shift, or job outcome."
    ]
  },
  {
    title: "Commercial Terms",
    paragraphs: [
      "Commercial terms, support scope, and any paid services will be set out at the point of order or in a separate written agreement.",
      "Unless stated otherwise, all charges are exclusive of VAT where applicable."
    ],
    bullets: [
      "Payment deadlines must be followed",
      "Failure to pay may lead to suspension of support, listings, or platform access",
      "Refunds are only offered where required by law or where Athena Pro agrees in writing"
    ]
  },
  {
    title: "Acceptable Use",
    bullets: [
      "Do not use the website for unlawful purposes",
      "Do not upload false, defamatory, discriminatory, or infringing content",
      "Do not attempt to gain unauthorised access to systems",
      "Do not introduce viruses, malware, or harmful code",
      "Do not scrape, copy, or reuse website content without permission",
      "Do not impersonate another person or business"
    ]
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "All intellectual property rights in the website, branding, design, text, graphics, and software belong to Athena Pro or its licensors unless otherwise stated.",
      "No part of the website may be reproduced, distributed, or commercially exploited without prior written permission."
    ]
  },
  {
    title: "Availability",
    paragraphs: [
      "Athena Pro does not guarantee that the website will always be available, uninterrupted, secure, or error-free. Maintenance, updates, and changes may be carried out without notice."
    ]
  },
  {
    title: "Third-Party Content and Links",
    paragraphs: [
      "The website may contain links to third-party websites or services. Athena Pro is not responsible for the content, availability, or privacy practices of those third parties."
    ]
  },
  {
    title: "Liability",
    bullets: [
      "The website is not guaranteed to meet every specific requirement",
      "Athena Pro is not responsible for employment outcomes or disputes between independent users of the platform",
      "Athena Pro is not liable for indirect or consequential losses, including loss of profit, business, goodwill, or opportunity"
    ],
    paragraphs: [
      "Nothing in these terms excludes or limits liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or anything else that cannot legally be excluded under UK law."
    ]
  },
  {
    title: "Suspension and Termination",
    paragraphs: [
      "Access to the website or services may be suspended or terminated where there is a reasonable belief that these terms have been breached."
    ]
  },
  {
    title: "Privacy and Data Protection",
    paragraphs: [
      "Use of the website is also governed by the Privacy Policy, which explains how personal data is collected, used, and protected."
    ]
  },
  {
    title: "Changes to These Terms",
    paragraphs: [
      "These terms may be updated from time to time. The latest version will always be posted on the website with the updated date."
    ]
  },
  {
    title: "Governing Law",
    paragraphs: [
      "These terms are governed by the laws of England and Wales. The courts of England and Wales shall have exclusive jurisdiction unless another UK jurisdiction is required by applicable law."
    ]
  }
] as const;

export const PRIVACY_CONTENT: readonly ContentSection[] = [
  {
    title: "Who We Are",
    paragraphs: [
      "Athena Pro is the data controller for personal data collected through the website and services.",
      SITE_CONTACT.registrationNote
    ],
    bullets: [
      "Business name: Athena Pro",
      `Registered office: ${SITE_CONTACT.registeredOffice}`,
      `Contact email: ${SITE_CONTACT.privacyEmail}`
    ]
  },
  {
    title: "The Personal Data We Collect",
    paragraphs: ["Depending on how the website is used, Athena Pro may collect the following categories of personal data."],
    bullets: [
      "Name, email address, telephone number, and company name",
      "Event briefs, job details, and operational requirements",
      "Profile, experience, review, and availability information",
      "Account login details",
      "Messages or enquiries sent to Athena Pro",
      "IP address, browser version, device information, and usage data",
      "Cookies, similar technologies, pages visited, and website actions taken"
    ]
  },
  {
    title: "How Personal Data Is Used",
    bullets: [
      "Provide and manage services",
      "Coordinate jobs and event delivery",
      "Respond to enquiries and support requests",
      "Manage accounts and commercial records",
      "Improve website performance and user experience",
      "Detect fraud, abuse, or security incidents",
      "Send relevant service communications",
      "Send marketing communications where permitted by law or where consent has been given"
    ]
  },
  {
    title: "Lawful Bases for Processing",
    bullets: [
      "Contract, where processing is necessary to provide services",
      "Legitimate interests, where business use of the data does not override user rights",
      "Legal obligation, where the law requires processing",
      "Consent, for example for certain marketing communications or optional cookies"
    ]
  },
  {
    title: "How Personal Data Is Shared",
    bullets: [
      "Companies where field team members apply for jobs or accept deployment",
      "Service providers supporting hosting, analytics, communications, or payment processing",
      "Professional advisers where necessary",
      "Regulators, law enforcement, or courts where required by law"
    ],
    paragraphs: ["Athena Pro does not sell personal data."]
  },
  {
    title: "International Transfers",
    paragraphs: [
      "Where personal data is transferred outside the UK, appropriate safeguards are used to protect it in line with applicable data protection law."
    ]
  },
  {
    title: "Data Retention",
    bullets: [
      "Customer and billing records may be kept for up to 6 years where required for legal or tax purposes",
      "Operational platform records may be kept as long as needed to provide services and manage legitimate business records",
      "Marketing preferences are kept until a user unsubscribes or asks for marketing to stop"
    ]
  },
  {
    title: "Your Rights",
    bullets: [
      "Be informed about how data is used",
      "Access the personal data held about you",
      "Request correction of inaccurate data",
      "Request deletion in certain circumstances",
      "Request restriction of processing",
      "Object to certain processing",
      "Request transfer of data where applicable",
      "Withdraw consent where processing relies on consent"
    ],
    paragraphs: [`To exercise these rights, email ${SITE_CONTACT.privacyEmail}.`]
  },
  {
    title: "Cookies",
    paragraphs: [
      "Athena Pro may use cookies and similar technologies to operate the website, analyse traffic, remember preferences, and improve services.",
      "Where required, consent will be requested before non-essential cookies are placed."
    ]
  },
  {
    title: "Marketing",
    paragraphs: [
      "Service-related communications may be sent where necessary. Marketing communications will only be sent where permitted by law, and users can unsubscribe at any time."
    ]
  },
  {
    title: "Security",
    paragraphs: [
      "Appropriate technical and organisational measures are used to protect personal data against unauthorised access, loss, misuse, or alteration, but no internet system can guarantee absolute security."
    ]
  },
  {
    title: "Complaints",
    paragraphs: [
      `Questions or concerns should be raised first at ${SITE_CONTACT.privacyEmail}.`,
      "Users also have the right to complain to the Information Commissioner's Office (ICO)."
    ]
  },
  {
    title: "Changes to This Policy",
    paragraphs: [
      "This privacy policy may be updated from time to time. The latest version will always appear on the website with the updated date."
    ]
  }
] as const;
