/**
 * AFF Founder Knowledge Hub service boundary — the only place a Resource is
 * read or a ResourceBookmark is created/removed. Resources themselves are a
 * shared catalog (like lib/services/opportunities.ts); bookmarks are
 * Map<startupId, ...>-scoped and MUST stay isolated (see
 * resources-isolation.test.ts).
 *
 * Every seeded resource is short, original AFF demo content or a
 * structured template — never a copied external article. origin is always
 * explicit (AFF_RESOURCE vs EXTERNAL_RESOURCE); no fabricated "N founders
 * viewed this" style counters anywhere in this file.
 *
 * Resource -> Task reuses the existing Task system
 * (Task.sourceType="RESOURCE_ACTION", added to types/roadmap.ts this
 * batch) — dedup guarded by ResourceBookmark storing a taskId, mirroring
 * lib/services/mentoring.ts#createTaskFromRecommendation.
 */
import type { Resource, ResourceBookmark } from "@/types/resources";
import type { Task } from "@/types/roadmap";
import * as taskService from "@/lib/services/tasks";

const catalog: Resource[] = [];
const bookmarksStore = new Map<string, ResourceBookmark[]>();
// resourceId -> per-startup taskId, so "add to tasks" is dedup-guarded the
// same way ExpertRecommendation.taskId guards its own conversion — keyed by
// startupId+resourceId since a Resource (unlike a recommendation) is shared.
const resourceTaskStore = new Map<string, string>(); // key: `${startupId}::${resourceId}`

function bookmarksFor(startupId: string): ResourceBookmark[] {
  return bookmarksStore.get(startupId) ?? [];
}
function saveBookmarks(startupId: string, items: ResourceBookmark[]) {
  bookmarksStore.set(startupId, items);
}

export function listResources(): Resource[] {
  return catalog;
}

export function getResource(id: string): Resource | undefined {
  return catalog.find((r) => r.id === id);
}

// ---------------------------------------------------------------------------
// Bookmarks — startup-isolated, no duplicates.
// ---------------------------------------------------------------------------

export function listBookmarks(startupId: string): ResourceBookmark[] {
  return bookmarksFor(startupId);
}

export function isBookmarked(startupId: string, resourceId: string): boolean {
  return bookmarksFor(startupId).some((b) => b.resourceId === resourceId);
}

export function bookmarkResource(startupId: string, resourceId: string, nowIso: string): ResourceBookmark {
  if (!getResource(resourceId)) throw new Error(`No resource "${resourceId}" found`);
  const existing = bookmarksFor(startupId).find((b) => b.resourceId === resourceId);
  if (existing) return existing;
  const bookmark: ResourceBookmark = { startupId, resourceId, savedAt: nowIso };
  saveBookmarks(startupId, [...bookmarksFor(startupId), bookmark]);
  return bookmark;
}

export function unbookmarkResource(startupId: string, resourceId: string): void {
  saveBookmarks(startupId, bookmarksFor(startupId).filter((b) => b.resourceId !== resourceId));
}

// ---------------------------------------------------------------------------
// Resource -> Task
// ---------------------------------------------------------------------------

export function createTaskFromResource(startupId: string, resourceId: string, nowIso: string): { task: Task } {
  const resource = getResource(resourceId);
  if (!resource) throw new Error(`No resource "${resourceId}" found`);
  const key = `${startupId}::${resourceId}`;
  if (resourceTaskStore.has(key)) {
    throw new Error(`A task already exists for resource "${resourceId}" on startup "${startupId}".`);
  }

  const task = taskService.createTask(
    startupId,
    {
      title: `Complete: ${resource.title.en}`,
      description: resource.description.en,
      category: "resources",
      sourceType: "RESOURCE_ACTION",
      createdBy: "FOUNDER",
      linkedModule: "resources",
    },
    nowIso,
  );
  const taskWithSource = taskService.updateTask(startupId, task.id, { sourceReference: resourceId }, nowIso);
  resourceTaskStore.set(key, task.id);
  return { task: taskWithSource };
}

export function getTaskIdForResource(startupId: string, resourceId: string): string | undefined {
  return resourceTaskStore.get(`${startupId}::${resourceId}`);
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetResourcesStoreForTests() {
  bookmarksStore.clear();
  resourceTaskStore.clear();
}

// ---------------------------------------------------------------------------
// Seed: ~20 short, original AFF demo resources spanning every category and
// format. AFF_RESOURCE content is written here directly; the one
// EXTERNAL_RESOURCE entry uses a known-safe generic example domain only.
// ---------------------------------------------------------------------------

function add(resource: Omit<Resource, "createdAt">) {
  catalog.push({ ...resource, createdAt: "2026-01-01T00:00:00.000Z" });
}

function seedDemoResources() {
  if (catalog.length > 0) return;

  add({
    id: "res-startup-basics-guide",
    title: { en: "Starting Up: The AFF Basics Guide", fr: "Se lancer : le guide de base AFF" },
    description: {
      en: "A short orientation to how AFF's dashboard modules fit together — Digital Twin, Readiness, Roadmap and Tasks.",
      fr: "Une courte orientation sur l'articulation des modules du tableau de bord AFF — Jumeau numérique, Préparation, Feuille de route et Tâches.",
    },
    category: "STARTUP_BASICS",
    format: "GUIDE",
    stages: ["idea", "mvp"],
    estimatedMinutes: 8,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-problem-validation-checklist",
    title: { en: "Problem Validation Checklist", fr: "Liste de vérification de la validation du problème" },
    description: {
      en: "Ten questions to answer with real evidence before you build — not opinions, actual customer conversations.",
      fr: "Dix questions à valider avec de vraies preuves avant de construire — pas des opinions, de vraies conversations clients.",
    },
    category: "PROBLEM_VALIDATION",
    format: "CHECKLIST",
    stages: ["idea"],
    estimatedMinutes: 15,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-mvp-scoping-framework",
    title: { en: "MVP Scoping Framework", fr: "Cadre de cadrage du MVP" },
    description: {
      en: "A simple must/should/could framework for deciding what actually belongs in your first release.",
      fr: "Un cadre simple indispensable/souhaitable/possible pour décider ce qui doit figurer dans votre première version.",
    },
    category: "PRODUCT",
    format: "FRAMEWORK",
    stages: ["idea", "mvp"],
    estimatedMinutes: 20,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-market-sizing-template",
    title: { en: "Market Sizing Template (TAM/SAM/SOM)", fr: "Modèle de dimensionnement du marché (TAM/SAM/SOM)" },
    description: {
      en: "A structured template for estimating your addressable market with sources, not guesses.",
      fr: "Un modèle structuré pour estimer votre marché adressable avec des sources, pas des suppositions.",
    },
    category: "MARKET",
    format: "TEMPLATE",
    stages: ["idea", "mvp", "early_traction"],
    estimatedMinutes: 25,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-business-model-canvas-guide",
    title: { en: "Business Model Canvas Guide", fr: "Guide du Business Model Canvas" },
    description: {
      en: "A walkthrough of the classic canvas adapted to AFF's Digital Twin business model fields.",
      fr: "Un parcours guidé du canevas classique adapté aux champs du modèle économique du jumeau numérique AFF.",
    },
    category: "BUSINESS_MODEL",
    format: "GUIDE",
    stages: ["idea", "mvp"],
    estimatedMinutes: 20,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-sales-pipeline-template",
    title: { en: "Early Sales Pipeline Template", fr: "Modèle de pipeline de ventes précoce" },
    description: {
      en: "A lightweight spreadsheet structure for tracking your first 20 prospects without a CRM.",
      fr: "Une structure de feuille de calcul légère pour suivre vos 20 premiers prospects sans CRM.",
    },
    category: "SALES",
    format: "TEMPLATE",
    stages: ["mvp", "early_traction"],
    estimatedMinutes: 10,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-launch-marketing-checklist",
    title: { en: "Launch Marketing Checklist", fr: "Liste de vérification marketing de lancement" },
    description: {
      en: "The essentials to line up before a public launch — messaging, channels, and a simple tracking sheet.",
      fr: "Les essentiels à préparer avant un lancement public — message, canaux et une simple feuille de suivi.",
    },
    category: "MARKETING",
    format: "CHECKLIST",
    stages: ["mvp", "early_traction"],
    estimatedMinutes: 12,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-runway-basics-guide",
    title: { en: "Understanding Runway and Burn", fr: "Comprendre la trésorerie disponible et le taux de combustion" },
    description: {
      en: "How AFF calculates runway from your cash balance and net burn, and what to do when it's short.",
      fr: "Comment AFF calcule la trésorerie disponible à partir de votre solde de trésorerie et de votre taux de combustion net, et que faire si elle est courte.",
    },
    category: "FINANCE",
    format: "GUIDE",
    stages: ["mvp", "early_traction", "growth"],
    estimatedMinutes: 10,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-fundraising-checklist",
    title: { en: "Fundraising Readiness Checklist", fr: "Liste de vérification de préparation à la levée de fonds" },
    description: {
      en: "What investors typically ask for before a first meeting, mapped to your Data Room categories.",
      fr: "Ce que les investisseurs demandent généralement avant une première réunion, mis en correspondance avec vos catégories de salle de données.",
    },
    category: "FUNDRAISING",
    format: "CHECKLIST",
    stages: ["early_traction", "growth"],
    estimatedMinutes: 15,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-ask-slide-template",
    title: { en: "The Ask Slide Template", fr: "Modèle de diapositive de demande" },
    description: {
      en: "A structured template for stating your instrument, amount and use of funds without ambiguity.",
      fr: "Un modèle structuré pour indiquer clairement votre instrument, montant et utilisation des fonds.",
    },
    category: "FUNDRAISING",
    format: "TEMPLATE",
    stages: ["early_traction", "growth"],
    estimatedMinutes: 10,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-pitch-structure-framework",
    title: { en: "10-Slide Pitch Structure", fr: "Structure de pitch en 10 diapositives" },
    description: {
      en: "The section order Pitch Lab expects and why each one exists, from problem to ask.",
      fr: "L'ordre des sections attendu par Pitch Lab et pourquoi chacune existe, du problème à la demande.",
    },
    category: "PITCH",
    format: "FRAMEWORK",
    stages: ["mvp", "early_traction", "growth"],
    estimatedMinutes: 15,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-pitch-practice-guide",
    title: { en: "Practicing Your Pitch Out Loud", fr: "S'entraîner à présenter son pitch à voix haute" },
    description: {
      en: "How to use Pitch Practice and Q&A mode effectively before a real investor conversation.",
      fr: "Comment utiliser efficacement le mode Pratique et Q&R avant une véritable conversation avec un investisseur.",
    },
    category: "PITCH",
    format: "GUIDE",
    stages: ["early_traction", "growth"],
    estimatedMinutes: 8,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-company-registration-guide",
    title: { en: "Company Registration Basics", fr: "Bases de l'enregistrement de l'entreprise" },
    description: {
      en: "A plain-language overview of what 'registered' vs 'in progress' typically involves — always confirm locally.",
      fr: "Un aperçu en langage simple de ce que « enregistré » contre « en cours » implique généralement — vérifiez toujours localement.",
    },
    category: "LEGAL",
    format: "GUIDE",
    stages: ["idea", "mvp"],
    estimatedMinutes: 10,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-data-room-completion-guide",
    title: { en: "Understanding Data Room Completion", fr: "Comprendre l'achèvement de la salle de données" },
    description: {
      en: "How the completion percentage is computed from your stage's required document checklist.",
      fr: "Comment le pourcentage d'achèvement est calculé à partir de la liste de documents requis pour votre stade.",
    },
    category: "OPERATIONS",
    format: "GUIDE",
    stages: ["mvp", "early_traction", "growth", "scale"],
    estimatedMinutes: 6,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-ops-sop-template",
    title: { en: "Standard Operating Procedure Template", fr: "Modèle de procédure opérationnelle normalisée" },
    description: {
      en: "A minimal one-page SOP template for documenting a repeatable process as your team grows.",
      fr: "Un modèle de procédure opérationnelle normalisée d'une page pour documenter un processus reproductible à mesure que votre équipe grandit.",
    },
    category: "OPERATIONS",
    format: "TEMPLATE",
    stages: ["early_traction", "growth"],
    estimatedMinutes: 10,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-hiring-first-hires-guide",
    title: { en: "Making Your First Hires", fr: "Réaliser vos premières embauches" },
    description: {
      en: "What to define before hiring: role scope, equity vs salary tradeoffs, and a simple offer checklist.",
      fr: "Ce qu'il faut définir avant d'embaucher : périmètre du rôle, arbitrages équité/salaire, et une simple liste de vérification d'offre.",
    },
    category: "TEAM",
    format: "CHECKLIST",
    stages: ["mvp", "early_traction"],
    estimatedMinutes: 12,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-cofounder-agreement-template",
    title: { en: "Co-founder Agreement Starting Points", fr: "Points de départ pour un accord entre cofondateurs" },
    description: {
      en: "A structured list of the topics a co-founder agreement should cover — not legal advice, a starting checklist.",
      fr: "Une liste structurée des sujets qu'un accord entre cofondateurs devrait couvrir — pas un conseil juridique, une liste de départ.",
    },
    category: "TEAM",
    format: "TEMPLATE",
    stages: ["idea", "mvp"],
    estimatedMinutes: 10,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-impact-metrics-framework",
    title: { en: "Choosing Honest Impact Metrics", fr: "Choisir des indicateurs d'impact honnêtes" },
    description: {
      en: "A framework for picking impact/ESG metrics you can actually measure, rather than aspirational ones.",
      fr: "Un cadre pour choisir des indicateurs d'impact/ESG que vous pouvez réellement mesurer, plutôt que des indicateurs aspirationnels.",
    },
    category: "IMPACT_ESG",
    format: "FRAMEWORK",
    stages: ["mvp", "early_traction", "growth"],
    estimatedMinutes: 15,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-expert-matching-guide",
    title: { en: "Getting the Most from Expert Matching", fr: "Tirer le meilleur parti de la mise en relation avec des experts" },
    description: {
      en: "How expert relevance is determined and how to write a support request that gets a useful response.",
      fr: "Comment la pertinence des experts est déterminée et comment rédiger une demande de soutien qui obtient une réponse utile.",
    },
    category: "STARTUP_BASICS",
    format: "GUIDE",
    stages: ["mvp", "early_traction", "growth"],
    estimatedMinutes: 8,
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
  });
  add({
    id: "res-external-lean-canvas-tool",
    title: { en: "External Tool: A Generic Lean Canvas Template", fr: "Outil externe : un modèle générique de Lean Canvas" },
    description: {
      en: "A generic, freely available lean-canvas template hosted outside AFF — useful as a companion to the Business Model Canvas Guide above.",
      fr: "Un modèle générique de lean canvas disponible gratuitement, hébergé en dehors d'AFF — utile en complément du guide du Business Model Canvas ci-dessus.",
    },
    category: "BUSINESS_MODEL",
    format: "TOOL",
    stages: ["idea", "mvp"],
    origin: "EXTERNAL_RESOURCE",
    externalUrl: "https://example.org/lean-canvas-template",
    languages: ["en"],
  });
}
seedDemoResources();
