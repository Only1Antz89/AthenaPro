import { existsSync, readFileSync } from "node:fs";

const requiredTables = [
  "profiles",
  "organizations",
  "events",
  "jobs",
  "applications",
  "operator_profiles",
  "operator_availability_rules",
  "operator_payment_profiles",
  "saved_jobs",
  "job_alerts",
  "company_follows",
  "job_likes",
  "dismissed_jobs",
  "job_media_slides",
  "conversation_threads",
  "conversation_messages",
  "push_subscriptions",
  "ratings",
  "client_feedback",
  "notifications",
  "notification_email_jobs"
];

function loadLocalEnv() {
  const values = {};

  if (!existsSync(".env.local")) {
    return values;
  }

  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    values[key] = value;
  }

  return values;
}

async function requestJson(url, path, key) {
  let response;

  try {
    response = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
  } catch (error) {
    const hostname = (() => {
      try {
        return new URL(url).hostname;
      } catch {
        return "invalid-url";
      }
    })();
    const cause = error?.cause ? ` (${error.cause.code ?? error.cause.message ?? error.cause}; host=${hostname})` : "";
    throw new Error(`${error.message}${cause}`);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${text}`);
  }

  return JSON.parse(text);
}

const localEnv = loadLocalEnv();
const config = { ...process.env, ...localEnv };

const supabaseUrl = config.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = config.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = config.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  throw new Error("Supabase URL, anon key, and service-role key are required for schema health checks.");
}

const missingTables = [];

for (const table of requiredTables) {
  try {
    await requestJson(supabaseUrl, `${table}?select=*&limit=1`, serviceKey);
  } catch (error) {
    missingTables.push(`${table}: ${error.message}`);
  }
}

if (missingTables.length > 0) {
  console.error("Missing or inaccessible Supabase tables:");
  for (const table of missingTables) {
    console.error(`- ${table}`);
  }
  process.exit(1);
}

const publicJobs = await requestJson(
  supabaseUrl,
  "jobs?select=id,title,events(id,title,status),organizations(id,name,slug)&status=eq.open&limit=20",
  anonKey
);

const jobsWithMissingRelations = publicJobs.filter((job) => !job.events?.id || !job.organizations?.id);

if (jobsWithMissingRelations.length > 0) {
  console.error("Open jobs are missing embedded event or organization data:");
  for (const job of jobsWithMissingRelations) {
    console.error(`- ${job.id} ${job.title}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedTables: requiredTables.length,
      openJobsChecked: publicJobs.length
    },
    null,
    2
  )
);
