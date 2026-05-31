import type {
  Application,
  ApplicationStatusHistoryEntry,
  ClientFeedback,
  CompanyFollow,
  ConversationMessage,
  ConversationThread,
  DemoDatabase,
  DismissedJob,
  Event,
  JobViewEvent,
  MarketingPreference,
  Job,
  JobAlert,
  JobLike,
  JobMediaSlide,
  Notification,
  NotificationEmailJob,
  OperatorAvailabilityRule,
  OperatorPaymentProfile,
  OperatorProfile,
  Organization,
  OrganizationMembership,
  Profile,
  PushSubscriptionRecord,
  Rating,
  SavedJob
} from "@/types/domain";

function nowMinusDays(days: number, time = "09:00:00") {
  const base = new Date();
  base.setDate(base.getDate() - days);
  const [hours, minutes, seconds] = time.split(":").map(Number);
  base.setHours(hours, minutes, seconds, 0);
  return base.toISOString();
}

function daysFromNow(days: number, time = "09:00:00") {
  const base = new Date();
  base.setDate(base.getDate() + days);
  const [hours, minutes, seconds] = time.split(":").map(Number);
  base.setHours(hours, minutes, seconds, 0);
  return base.toISOString();
}

function nowMinusHours(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function buildAvailabilityRules(
  operatorId: string,
  pattern: "weekends" | "midweek" | "full"
): OperatorAvailabilityRule[] {
  return Array.from({ length: 7 }).map((_, dayOfWeek) => {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isMidweek = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isAvailable =
      pattern === "full" ? true : pattern === "weekends" ? isWeekend : isMidweek;

    return {
      id: `${operatorId}_availability_${dayOfWeek}`,
      operatorId,
      dayOfWeek,
      isAvailable,
      isAllDay: pattern === "full",
      startTime: isAvailable && pattern !== "full" ? (pattern === "weekends" ? "15:00" : "08:00") : undefined,
      endTime: isAvailable && pattern !== "full" ? (pattern === "weekends" ? "23:59" : "18:00") : undefined
    };
  });
}

const organizations: Organization[] = [
  { id: "org_ember", name: "Ember Collective", slug: "ember-collective", createdAt: nowMinusDays(240) },
  { id: "org_harbour", name: "Harbour Live", slug: "harbour-live", createdAt: nowMinusDays(220) },
  { id: "org_nova", name: "Nova Occasions", slug: "nova-occasions", createdAt: nowMinusDays(180) }
];

const organiserProfiles: Profile[] = [
  {
    id: "user_org_1",
    role: "organiser",
    fullName: "Leah Thompson",
    email: "leah@embercollective.co",
    companyName: "Ember Collective",
    skills: [],
    location: "London",
    createdAt: nowMinusDays(240),
    updatedAt: nowMinusDays(1)
  },
  {
    id: "user_org_2",
    role: "organiser",
    fullName: "Harvey Cole",
    email: "harvey@harbourlive.co",
    companyName: "Harbour Live",
    skills: [],
    location: "Brighton",
    createdAt: nowMinusDays(220),
    updatedAt: nowMinusDays(1)
  },
  {
    id: "user_org_3",
    role: "organiser",
    fullName: "Nadia Yusuf",
    email: "nadia@novaoccasions.co",
    companyName: "Nova Occasions",
    skills: [],
    location: "Manchester",
    createdAt: nowMinusDays(180),
    updatedAt: nowMinusDays(1)
  }
];

const operatorBlueprints = [
  ["Ava Morgan", "bar, guest management, VIP", "Weekends + evenings", "London Central", 24],
  ["Theo Carter", "runner, logistics, retail", "Flexible midweek", "South East London", 22],
  ["Mia Wallace", "reception, accreditation, guest services", "Full-time freelance", "Canary Wharf", 28],
  ["Noah Reed", "security support, access control, stewarding", "Weekends + evenings", "Birmingham", 31],
  ["Ella James", "mixology, floor service, till", "Flexible midweek", "Brighton", 26],
  ["Lucas Bennett", "production assistant, set-up, logistics", "Full-time freelance", "Manchester", 29],
  ["Grace Patel", "registration, admin, hospitality", "Weekends + evenings", "West London", 25],
  ["Ethan Green", "merch, customer support, stock", "Flexible midweek", "Brighton", 23],
  ["Lily Adams", "brand ambassador, sampling, lead capture", "Full-time freelance", "Birmingham", 27],
  ["Archie Scott", "stewarding, queue management, security support", "Weekends + evenings", "Brighton", 30],
  ["Chloe Ross", "conference host, microphone running, front-of-house", "Flexible midweek", "London Central", 29],
  ["Freddie Hall", "barback, cellar, clean-down", "Full-time freelance", "South East London", 24]
] as const;

const staffProfiles: Profile[] = operatorBlueprints.map(
  ([fullName, skills, availability, location, age], index) => ({
    id: `user_staff_${index + 1}`,
    role: "staff" as const,
    fullName,
    email: `${fullName.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.+$/, "")}@demo.staffbook.app`,
    phone: `07123 0000${index}`,
    bio: `${fullName} is a reliable event professional with strong client feedback and repeat-booking appeal.`,
    skills: skills.split(",").map((item) => item.trim()),
    availability,
    location,
    languages: index % 3 === 0 ? ["English", "French"] : ["English"],
    preferredRoles: skills
      .split(",")
      .map((item) => item.trim())
      .slice(0, 2),
    age,
    createdAt: nowMinusDays(90 - index),
    updatedAt: nowMinusDays(1)
  })
);

const operatorProfiles: OperatorProfile[] = staffProfiles.map((profile, index) => ({
  profileId: profile.id,
  displayName: profile.fullName,
  headline:
    index % 2 === 0 ? "Guest-facing operator with calm premium delivery." : "Reliable live-events operator with pace and composure.",
  baseLocation: profile.location,
  details: profile.bio,
  preferredRoles: profile.preferredRoles ?? [],
  languages: profile.languages ?? ["English"],
  canDrive: index % 3 !== 0,
  dateOfBirth: `${1992 + (index % 8)}-0${(index % 8) + 1}-15`,
  age: profile.age,
  avatarUrl: "",
  availabilitySummary: profile.availability,
  stripeAccountStatus: index % 4 === 0 ? "pending" : "not_started",
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt ?? nowMinusDays(1)
}));

const operatorAvailabilityRules: OperatorAvailabilityRule[] = staffProfiles.flatMap(
  (profile, index) =>
    buildAvailabilityRules(
      profile.id,
      index % 3 === 0 ? "weekends" : index % 3 === 1 ? "midweek" : "full"
    )
);

const operatorPaymentProfiles: OperatorPaymentProfile[] = staffProfiles.map((profile, index) => ({
  operatorId: profile.id,
  provider: "stripe",
  accountId: index % 4 === 0 ? `acct_demo_${index + 1}` : undefined,
  onboardingStatus: index % 4 === 0 ? "pending" : "not_started",
  payoutsEnabled: false,
  detailsSubmitted: index % 4 === 0,
  lastSyncedAt: index % 4 === 0 ? nowMinusDays(2) : undefined,
  updatedAt: nowMinusDays(1)
}));

const organizationMemberships: OrganizationMembership[] = organizations.map((organization, index) => ({
  id: `membership_${index + 1}`,
  organizationId: organization.id,
  profileId: organiserProfiles[index]!.id,
  role: "owner",
  createdAt: nowMinusDays(200 - index)
}));

const events: Event[] = [
  {
    id: "event_1",
    organizationId: "org_ember",
    createdBy: "user_org_1",
    title: "London Rooftop Launch",
    description: "Private product launch with VIP guests, drinks reception, and activation staff.",
    location: "Shoreditch, London",
    eventDate: daysFromNow(10, "18:00:00"),
    eventType: "Brand launch",
    requiredRoles: ["VIP host", "Bartender", "Runner"],
    serviceTier: "formal",
    serviceTierSource: "manual",
    suggestedServiceTier: "high_end",
    aiSuggestedTags: ["launch", "private", "vip", "reception"],
    aiSuggestedRoles: ["VIP host", "Bartender"],
    status: "published",
    createdAt: nowMinusDays(8),
    updatedAt: nowMinusDays(3)
  },
  {
    id: "event_2",
    organizationId: "org_ember",
    createdBy: "user_org_1",
    title: "Investor Breakfast Briefing",
    description: "High-touch breakfast event requiring registration, service, and room reset staff.",
    location: "Canary Wharf, London",
    eventDate: daysFromNow(3, "07:30:00"),
    eventType: "Corporate",
    requiredRoles: ["Registration", "Hospitality assistant"],
    serviceTier: "formal",
    serviceTierSource: "manual",
    suggestedServiceTier: "formal",
    aiSuggestedTags: ["investor", "briefing", "registration"],
    aiSuggestedRoles: ["Registration"],
    status: "published",
    createdAt: nowMinusDays(12),
    updatedAt: nowMinusDays(4)
  },
  {
    id: "event_3",
    organizationId: "org_harbour",
    createdBy: "user_org_2",
    title: "Harbour Summer Concert",
    description: "Outdoor live event with large crowds, merch, queue management, and guest services.",
    location: "Brighton Seafront",
    eventDate: daysFromNow(14, "15:00:00"),
    eventType: "Music",
    requiredRoles: ["Steward", "Merch assistant", "Guest services"],
    serviceTier: "festival",
    serviceTierSource: "manual",
    suggestedServiceTier: "festival",
    aiSuggestedTags: ["concert", "crowds", "outdoor"],
    aiSuggestedRoles: ["Steward", "Merch assistant"],
    status: "published",
    createdAt: nowMinusDays(9),
    updatedAt: nowMinusDays(5)
  },
  {
    id: "event_4",
    organizationId: "org_harbour",
    createdBy: "user_org_2",
    title: "Fashion Week Reception",
    description: "Evening reception for buyers and press with front-of-house and bar support.",
    location: "Soho, London",
    eventDate: nowMinusDays(12, "19:00:00"),
    eventType: "Fashion",
    requiredRoles: ["Host", "Bartender"],
    serviceTier: "high_end",
    serviceTierSource: "manual",
    suggestedServiceTier: "high_end",
    aiSuggestedTags: ["fashion", "buyers", "press", "reception"],
    aiSuggestedRoles: ["Host", "Bartender"],
    status: "completed",
    createdAt: nowMinusDays(30),
    updatedAt: nowMinusDays(11)
  },
  {
    id: "event_5",
    organizationId: "org_nova",
    createdBy: "user_org_3",
    title: "Tech Expo Registration Hub",
    description: "Two-day expo needing confident registration and accreditation specialists.",
    location: "Manchester Central",
    eventDate: daysFromNow(6, "08:00:00"),
    eventType: "Expo",
    requiredRoles: ["Registration", "Accreditation", "Floor support"],
    serviceTier: "mixed",
    serviceTierSource: "manual",
    suggestedServiceTier: "mixed",
    aiSuggestedTags: ["expo", "accreditation", "registration"],
    aiSuggestedRoles: ["Registration", "Accreditation"],
    status: "published",
    createdAt: nowMinusDays(6),
    updatedAt: nowMinusDays(2)
  },
  {
    id: "event_6",
    organizationId: "org_nova",
    createdBy: "user_org_3",
    title: "Luxury Retail Pop-Up",
    description: "Premium customer-facing retail experience with sampling and lead capture.",
    location: "Birmingham",
    eventDate: nowMinusDays(20, "10:00:00"),
    eventType: "Retail",
    requiredRoles: ["Brand ambassador", "Sales assistant"],
    serviceTier: "formal",
    serviceTierSource: "manual",
    suggestedServiceTier: "formal",
    aiSuggestedTags: ["luxury", "retail", "sampling"],
    aiSuggestedRoles: ["Brand ambassador"],
    status: "completed",
    createdAt: nowMinusDays(40),
    updatedAt: nowMinusDays(20)
  }
];

const jobs: Job[] = [
  ["job_1", "event_1", "org_ember", "user_org_1", "VIP Host", "Manage arrivals and guest flow for premium attendees.", "VIP host", daysFromNow(10, "17:00:00"), daysFromNow(10, "23:30:00"), 17, 3, "open", 21],
  ["job_2", "event_1", "org_ember", "user_org_1", "Bartender", "Cocktail and drinks service for launch night.", "Bartender", daysFromNow(10, "17:00:00"), daysFromNow(10, "23:30:00"), 18, 2, "open", 18],
  ["job_3", "event_2", "org_ember", "user_org_1", "Registration Assistant", "Check-in, badge handoff, and room wayfinding.", "Registration", daysFromNow(3, "06:45:00"), daysFromNow(3, "11:30:00"), 15, 2, "open", 18],
  ["job_4", "event_3", "org_harbour", "user_org_2", "Merch Assistant", "Support merch stand and stock movement during live concert.", "Merch", daysFromNow(14, "14:00:00"), daysFromNow(14, "23:00:00"), 14, 4, "open", 18],
  ["job_5", "event_3", "org_harbour", "user_org_2", "Steward", "Crowd flow support and stewarding across site.", "Steward", daysFromNow(14, "14:00:00"), daysFromNow(14, "23:30:00"), 13, 6, "open", 18],
  ["job_6", "event_4", "org_harbour", "user_org_2", "Reception Host", "Front-of-house, accreditation, and buyer guest handling.", "Host", nowMinusDays(12, "17:30:00"), nowMinusDays(12, "23:30:00"), 16, 2, "closed", 21],
  ["job_7", "event_4", "org_harbour", "user_org_2", "Evening Bartender", "Bar setup, service, and end-of-night close.", "Bartender", nowMinusDays(12, "17:00:00"), nowMinusDays(12, "23:30:00"), 18, 2, "closed", 18],
  ["job_8", "event_5", "org_nova", "user_org_3", "Accreditation Lead", "Badge printing and issue escalation at expo entry.", "Accreditation", daysFromNow(6, "07:00:00"), daysFromNow(6, "18:00:00"), 16, 2, "open", 18],
  ["job_9", "event_5", "org_nova", "user_org_3", "Expo Floor Support", "Hall guidance, speaker room support, and general assistance.", "Floor support", daysFromNow(6, "08:30:00"), daysFromNow(6, "17:00:00"), 14, 4, "open", 18],
  ["job_10", "event_6", "org_nova", "user_org_3", "Brand Ambassador", "Premium product sampling and qualified lead capture.", "Brand ambassador", nowMinusDays(20, "09:30:00"), nowMinusDays(20, "18:00:00"), 15, 3, "closed", 21]
].map(
  ([
    id,
    eventId,
    organizationId,
    createdBy,
    title,
    description,
    roleType,
    shiftStart,
    shiftEnd,
    payRate,
    positionsNeeded,
    status,
    minimumAge
  ]) => {
    const createdAtByJobId: Record<string, string> = {
      job_1: nowMinusHours(54),
      job_2: nowMinusHours(32),
      job_3: nowMinusHours(7),
      job_4: nowMinusHours(60),
      job_5: nowMinusHours(22),
      job_6: nowMinusDays(18),
      job_7: nowMinusDays(18),
      job_8: nowMinusHours(3),
      job_9: nowMinusHours(14),
      job_10: nowMinusDays(28)
    };

    const createdAt = createdAtByJobId[String(id)] ?? nowMinusDays(10);

    return {
    id: String(id),
    eventId: String(eventId),
    organizationId: String(organizationId),
    createdBy: String(createdBy),
    title: String(title),
    description: String(description),
    roleType: String(roleType),
    shiftStart: String(shiftStart),
    shiftEnd: String(shiftEnd),
    payRate: Number(payRate),
    positionsNeeded: Number(positionsNeeded),
    minimumAge: Number(minimumAge),
    status: status as Job["status"],
    createdAt,
    updatedAt: createdAt
  };
  }
);

const appliedAtByApplicationId: Record<string, string> = {
  app_1: nowMinusHours(8),
  app_4: nowMinusHours(18),
  app_5: nowMinusHours(42),
  app_9: nowMinusHours(5),
  app_10: nowMinusHours(70)
};

const applications: Application[] = [
  ["app_1", "job_1", "user_staff_1", "pending", "Experienced with high-touch launches and guest list handling."],
  ["app_2", "job_1", "user_staff_3", "accepted", "Confident VIP reception specialist with fashion and tech event experience."],
  ["app_3", "job_2", "user_staff_5", "accepted", "Strong cocktail service background and quick setup/close-down."],
  ["app_4", "job_3", "user_staff_7", "pending", "Registration and accreditation specialist across trade shows."],
  ["app_5", "job_4", "user_staff_8", "pending", "Retail and merch experience with stock accuracy focus."],
  ["app_6", "job_5", "user_staff_10", "accepted", "Large venue stewarding and calm crowd management."],
  ["app_7", "job_6", "user_staff_11", "accepted", "Strong front-of-house and buyer hospitality experience."],
  ["app_8", "job_7", "user_staff_12", "accepted", "Fast service bartender with premium event experience."],
  ["app_9", "job_8", "user_staff_3", "pending", "Accreditation and badge issuing experience at conferences."],
  ["app_10", "job_9", "user_staff_6", "pending", "Production support and floor-running for large events."],
  ["app_11", "job_10", "user_staff_9", "accepted", "Brand ambassador with strong lead capture and retail metrics."],
  ["app_12", "job_10", "user_staff_1", "accepted", "Confident product demo and guest engagement background."]
].map(([id, jobId, staffId, status, coverNote], index) => {
  const appliedAt = appliedAtByApplicationId[String(id)] ?? nowMinusDays(18 - index);

  return {
  id: String(id),
  jobId: String(jobId),
  staffId: String(staffId),
  status: status as Application["status"],
  coverNote: String(coverNote),
  appliedAt,
  updatedAt: appliedAt
  };
});

const jobViewEvents: JobViewEvent[] = [
  ["job_1", "user_staff_2", 4],
  ["job_1", "user_staff_4", 9],
  ["job_1", "user_staff_6", 28],
  ["job_2", "user_staff_1", 18],
  ["job_3", "user_staff_3", 2],
  ["job_3", "user_staff_7", 6],
  ["job_3", "user_staff_11", 20],
  ["job_3", "user_staff_12", 44],
  ["job_5", "user_staff_8", 30],
  ["job_5", "user_staff_10", 52],
  ["job_8", "user_staff_5", 3],
  ["job_8", "user_staff_9", 8],
  ["job_8", "user_staff_11", 12],
  ["job_8", "user_staff_1", 26],
  ["job_9", "user_staff_6", 46]
].map(([jobId, viewerId, hoursAgo], index) => ({
  id: `view_${index + 1}`,
  jobId: String(jobId),
  viewerId: String(viewerId),
  viewedAt: nowMinusHours(Number(hoursAgo))
}));

const applicationHistory: ApplicationStatusHistoryEntry[] = applications.map((application, index) => ({
  id: `hist_${index + 1}`,
  applicationId: application.id,
  fromStatus: null,
  toStatus: "pending",
  actorId: application.staffId,
  createdAt: application.appliedAt
}));

const ratings: Rating[] = [
  [
    "rating_1",
    "event_4",
    "job_6",
    "org_harbour",
    "user_staff_11",
    "user_org_2",
    [5, 5, 5, 5, 5],
    "Fantastic with VIP arrivals and guest calm under pressure."
  ],
  [
    "rating_2",
    "event_4",
    "job_7",
    "org_harbour",
    "user_staff_12",
    "user_org_2",
    [4, 4, 4, 4, 4],
    "Solid bartender and reliable on close-down."
  ],
  [
    "rating_3",
    "event_6",
    "job_10",
    "org_nova",
    "user_staff_9",
    "user_org_3",
    [5, 5, 4, 5, 5],
    "Confident seller, strong brand energy, delivered quality leads."
  ],
  [
    "rating_4",
    "event_6",
    "job_10",
    "org_nova",
    "user_staff_1",
    "user_org_3",
    [4, 5, 4, 5, 4],
    "Professional and personable with customers all day."
  ]
].map(([id, eventId, jobId, organizationId, staffId, organiserId, scores, comment], index) => {
  const [reliabilityScore, professionalismScore, communicationScore, customerServiceScore, pressureHandlingScore] =
    scores as number[];
  const overallScore =
    (reliabilityScore +
      professionalismScore +
      communicationScore +
      customerServiceScore +
      pressureHandlingScore) /
    5;

  return {
    id: String(id),
    eventId: String(eventId),
    jobId: String(jobId),
    organizationId: String(organizationId),
    staffId: String(staffId),
    organiserId: String(organiserId),
    reliabilityScore,
    professionalismScore,
    communicationScore,
    customerServiceScore,
    pressureHandlingScore,
    overallScore,
    rating: overallScore,
    comment: String(comment),
    createdAt: nowMinusDays(20 - index)
  };
});

const clientFeedback: ClientFeedback[] = [
  {
    id: "feedback_1",
    assignmentId: "app_7",
    jobId: "job_6",
    organizationId: "org_harbour",
    staffId: "user_staff_11",
    clientId: "org_harbour",
    sentiment: "up",
    reasons: ["clear_brief", "respectful_team", "would_work_again"],
    note: "Brief was precise and the onsite team ran a tidy guest handoff.",
    createdAt: nowMinusDays(11)
  },
  {
    id: "feedback_2",
    assignmentId: "app_11",
    jobId: "job_10",
    organizationId: "org_nova",
    staffId: "user_staff_9",
    clientId: "org_nova",
    sentiment: "down",
    reasons: ["poor_organisation"],
    note: "Onsite escalation path was unclear once the floor got busy.",
    createdAt: nowMinusDays(19)
  }
];

const notifications: Notification[] = [
  {
    id: "notification_seed_1",
    userId: "user_staff_9",
    type: "promotion_due",
    title: "Promotion within reach",
    body: "Complete the next assignment with another strong review to move into the next rating band.",
    href: "/dashboard/staff",
    isRead: false,
    createdAt: nowMinusDays(1),
    emailStatus: "queued"
  }
];

const notificationEmailJobs: NotificationEmailJob[] = [
  {
    id: "email_seed_1",
    notificationId: "notification_seed_1",
    userId: "user_staff_9",
    templateKey: "promotion_due",
    status: "queued",
    payload: JSON.stringify({ subject: "Promotion within reach" }),
    createdAt: nowMinusDays(1),
    updatedAt: nowMinusDays(1)
  }
];

const savedJobs: SavedJob[] = [
  {
    staffId: "user_staff_9",
    jobId: "job_3",
    createdAt: nowMinusDays(1)
  }
];

const jobAlerts: JobAlert[] = [
  {
    id: "job_alert_seed_1",
    staffId: "user_staff_9",
    name: "London guest services",
    query: "",
    location: "London",
    roleTypes: ["Guest Services", "Host"],
    minimumPay: 16,
    isActive: true,
    emailOptIn: true,
    createdAt: nowMinusDays(1),
    updatedAt: nowMinusDays(1)
  }
];

const companyFollows: CompanyFollow[] = [
  {
    staffId: "user_staff_9",
    organizationId: "org_1",
    createdAt: nowMinusDays(2)
  }
];

const jobLikes: JobLike[] = [
  {
    staffId: "user_staff_9",
    jobId: "job_2",
    createdAt: nowMinusDays(1)
  }
];

const dismissedJobs: DismissedJob[] = [];

const jobMediaSlides: JobMediaSlide[] = jobs.slice(0, 6).flatMap((job, index) => [
  {
    id: `media_${job.id}_1`,
    jobId: job.id,
    organizationId: job.organizationId,
    imageUrl:
      index % 3 === 0
        ? "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80"
        : index % 3 === 1
          ? "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80"
          : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    altText: "Festival crowd and live event lighting",
    caption: job.roleType,
    sortOrder: 0,
    createdAt: nowMinusDays(index + 1)
  }
]);

const conversationThreads: ConversationThread[] = [
  {
    id: "thread_seed_1",
    organizationId: "org_1",
    staffId: "user_staff_9",
    jobId: "job_3",
    eventId: jobs.find((job) => job.id === "job_3")?.eventId,
    subject: "Gate briefing for your next role",
    lastMessageAt: nowMinusDays(1),
    createdAt: nowMinusDays(2)
  }
];

const conversationMessages: ConversationMessage[] = [
  {
    id: "message_seed_1",
    threadId: "thread_seed_1",
    senderId: "user_organiser_1",
    body: "Briefing notes are live. Bring ID, black trainers, and arrive 30 minutes before call time.",
    createdAt: nowMinusDays(1)
  }
];

const pushSubscriptions: PushSubscriptionRecord[] = [];

const marketingPreferences: MarketingPreference[] = [...organiserProfiles, ...staffProfiles].map((profile) => ({
  profileId: profile.id,
  emailNormalized: profile.email.toLowerCase(),
  newsletterOptIn: false,
  offersOptIn: false,
  productUpdatesOptIn: false,
  marketingOptedOutAt: profile.updatedAt ?? profile.createdAt,
  source: "seed",
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt ?? profile.createdAt
}));

export function buildBaseDemoDatabase(): DemoDatabase {
  return structuredClone({
    organizations,
    profiles: [...organiserProfiles, ...staffProfiles],
    operatorProfiles,
    operatorAvailabilityRules,
    operatorPaymentProfiles,
    organizationMemberships,
    events,
    jobs,
    applications,
    applicationHistory,
    jobViewEvents,
    savedJobs,
    jobAlerts,
    companyFollows,
    jobLikes,
    dismissedJobs,
    jobMediaSlides,
    conversationThreads,
    conversationMessages,
    pushSubscriptions,
    ratings,
    clientFeedback,
    notifications,
    notificationEmailJobs,
    marketingPreferences
  });
}
