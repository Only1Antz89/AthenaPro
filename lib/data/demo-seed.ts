import type {
  Application,
  ApplicationStatusHistoryEntry,
  DemoDatabase,
  Event,
  Job,
  Organization,
  OrganizationMembership,
  Profile,
  Rating
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
    createdAt: nowMinusDays(240)
  },
  {
    id: "user_org_2",
    role: "organiser",
    fullName: "Harvey Cole",
    email: "harvey@harbourlive.co",
    companyName: "Harbour Live",
    skills: [],
    createdAt: nowMinusDays(220)
  },
  {
    id: "user_org_3",
    role: "organiser",
    fullName: "Nadia Yusuf",
    email: "nadia@novaoccasions.co",
    companyName: "Nova Occasions",
    skills: [],
    createdAt: nowMinusDays(180)
  }
];

const staffProfiles: Profile[] = [
  ["Ava Morgan", "bar, guest management, VIP"], ["Theo Carter", "runner, logistics, retail"],
  ["Mia Wallace", "reception, accreditation, guest services"], ["Noah Reed", "security support, access control, stewarding"],
  ["Ella James", "mixology, floor service, till"], ["Lucas Bennett", "production assistant, set-up, logistics"],
  ["Grace Patel", "registration, admin, hospitality"], ["Ethan Green", "merch, customer support, stock"],
  ["Lily Adams", "brand ambassador, sampling, lead capture"], ["Archie Scott", "stewarding, queue management, security support"],
  ["Chloe Ross", "conference host, microphone running, front-of-house"], ["Freddie Hall", "barback, cellar, clean-down"]
].map(([fullName, skills], index) => ({
  id: `user_staff_${index + 1}`,
  role: "staff" as const,
  fullName,
  email: `${fullName.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.+$/, "")}@demo.staffbook.app`,
  phone: `07123 0000${index}`,
  bio: `${fullName} is a reliable event professional with strong client feedback and repeat-booking appeal.`,
  skills: skills.split(",").map((item) => item.trim()),
  availability:
    index % 3 === 0 ? "Weekends + evenings" : index % 3 === 1 ? "Flexible midweek" : "Full-time freelance",
  createdAt: nowMinusDays(90 - index)
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
    status: "completed",
    createdAt: nowMinusDays(40),
    updatedAt: nowMinusDays(20)
  }
];

const jobs: Job[] = [
  ["job_1", "event_1", "org_ember", "user_org_1", "VIP Host", "Manage arrivals and guest flow for premium attendees.", "VIP host", daysFromNow(10, "17:00:00"), daysFromNow(10, "23:30:00"), 17, 3, "open"],
  ["job_2", "event_1", "org_ember", "user_org_1", "Bartender", "Cocktail and drinks service for launch night.", "Bartender", daysFromNow(10, "17:00:00"), daysFromNow(10, "23:30:00"), 18, 2, "open"],
  ["job_3", "event_2", "org_ember", "user_org_1", "Registration Assistant", "Check-in, badge handoff, and room wayfinding.", "Registration", daysFromNow(3, "06:45:00"), daysFromNow(3, "11:30:00"), 15, 2, "open"],
  ["job_4", "event_3", "org_harbour", "user_org_2", "Merch Assistant", "Support merch stand and stock movement during live concert.", "Merch", daysFromNow(14, "14:00:00"), daysFromNow(14, "23:00:00"), 14, 4, "open"],
  ["job_5", "event_3", "org_harbour", "user_org_2", "Steward", "Crowd flow support and stewarding across site.", "Steward", daysFromNow(14, "14:00:00"), daysFromNow(14, "23:30:00"), 13, 6, "open"],
  ["job_6", "event_4", "org_harbour", "user_org_2", "Reception Host", "Front-of-house, accreditation, and buyer guest handling.", "Host", nowMinusDays(12, "17:30:00"), nowMinusDays(12, "23:30:00"), 16, 2, "closed"],
  ["job_7", "event_4", "org_harbour", "user_org_2", "Evening Bartender", "Bar setup, service, and end-of-night close.", "Bartender", nowMinusDays(12, "17:00:00"), nowMinusDays(12, "23:30:00"), 18, 2, "closed"],
  ["job_8", "event_5", "org_nova", "user_org_3", "Accreditation Lead", "Badge printing and issue escalation at expo entry.", "Accreditation", daysFromNow(6, "07:00:00"), daysFromNow(6, "18:00:00"), 16, 2, "open"],
  ["job_9", "event_5", "org_nova", "user_org_3", "Expo Floor Support", "Hall guidance, speaker room support, and general assistance.", "Floor support", daysFromNow(6, "08:30:00"), daysFromNow(6, "17:00:00"), 14, 4, "open"],
  ["job_10", "event_6", "org_nova", "user_org_3", "Brand Ambassador", "Premium product sampling and qualified lead capture.", "Brand ambassador", nowMinusDays(20, "09:30:00"), nowMinusDays(20, "18:00:00"), 15, 3, "closed"]
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
    status
  ]) => ({
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
    status: status as Job["status"],
    createdAt: nowMinusDays(10),
    updatedAt: nowMinusDays(2)
  })
);

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
].map(([id, jobId, staffId, status, coverNote], index) => ({
  id: String(id),
  jobId: String(jobId),
  staffId: String(staffId),
  status: status as Application["status"],
  coverNote: String(coverNote),
  appliedAt: nowMinusDays(18 - index),
  updatedAt: nowMinusDays(10 - Math.min(index, 9))
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
  ["rating_1", "event_4", "org_harbour", "user_staff_11", "user_org_2", 5, "Fantastic with VIP arrivals and guest calm under pressure."],
  ["rating_2", "event_4", "org_harbour", "user_staff_12", "user_org_2", 4, "Solid bartender and reliable on close-down."],
  ["rating_3", "event_6", "org_nova", "user_staff_9", "user_org_3", 5, "Confident seller, strong brand energy, delivered quality leads."],
  ["rating_4", "event_6", "org_nova", "user_staff_1", "user_org_3", 4, "Professional and personable with customers all day."],
  ["rating_5", "event_6", "org_nova", "user_staff_9", "user_org_3", 5, "Asked smart questions and represented the client brilliantly."],
  ["rating_6", "event_4", "org_harbour", "user_staff_11", "user_org_2", 5, "Would rebook immediately. Excellent front-of-house polish."],
  ["rating_7", "event_4", "org_harbour", "user_staff_12", "user_org_2", 4, "Consistent service and good team communication."],
  ["rating_8", "event_6", "org_nova", "user_staff_1", "user_org_3", 5, "Great initiative and very good with premium customers."],
  ["rating_9", "event_6", "org_nova", "user_staff_3", "user_org_3", 5, "Registration and guest handling were exceptional."],
  ["rating_10", "event_4", "org_harbour", "user_staff_5", "user_org_2", 4, "Strong bar pace and a calm presence through peak service."]
].map(([id, eventId, organizationId, staffId, organiserId, rating, comment], index) => ({
  id: String(id),
  eventId: String(eventId),
  organizationId: String(organizationId),
  staffId: String(staffId),
  organiserId: String(organiserId),
  rating: Number(rating),
  comment: String(comment),
  createdAt: nowMinusDays(20 - index)
}));

export function buildBaseDemoDatabase(): DemoDatabase {
  return structuredClone({
    organizations,
    profiles: [...organiserProfiles, ...staffProfiles],
    organizationMemberships,
    events,
    jobs,
    applications,
    applicationHistory,
    ratings
  });
}
