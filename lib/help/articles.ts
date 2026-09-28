/**
 * AFF Help Center content — bilingual (FR/EN), describing the ACTUAL
 * implemented behavior of each module. Each article below was checked
 * against its real source file (named in the comment) at the time of
 * writing; if that file's logic changes, this article should be revisited.
 *
 * Distinct from Experts (human mentoring), Messages (founder inbox) and
 * Resources (knowledge hub) — this is product/UI help only.
 */
import type { HelpArticle } from "@/types/help";

export const helpArticles: HelpArticle[] = [
  {
    id: "help-getting-started",
    category: "GETTING_STARTED",
    title: { en: "Finding your way around the AFF dashboard", fr: "Se repérer dans le tableau de bord AFF" },
    body: {
      en: "The sidebar groups your workspace into Workspace (Command Center, My Startup, Readiness, Roadmap, Tasks), Build (Pitch Lab, Financials, Data Room), Connect (Experts, Investors, Pitch Live, Community) and Grow (Resources, Opportunities). The Command Center is your home screen — it summarizes readiness, this week's tasks, roadmap progress, your pitch and financial snapshot, and one relevant opportunity, all in one place. Everything shown is demo/founder-entered data in this version — there is no production database yet.",
      fr: "La barre latérale regroupe votre espace en Atelier (Centre de commande, Ma startup, Préparation, Feuille de route, Tâches), Construire (Pitch Lab, Finances, Salle de données), Connecter (Experts, Investisseurs, Pitch Live, Communauté) et Grandir (Ressources, Opportunités). Le Centre de commande est votre écran d'accueil — il résume la préparation, les tâches de la semaine, l'avancement de la feuille de route, votre pitch et un aperçu financier, ainsi qu'une opportunité pertinente. Toutes les données affichées sont des données de démonstration ou saisies par le fondateur dans cette version — il n'y a pas encore de base de données de production.",
    },
    keywords: ["dashboard", "navigation", "sidebar", "command center", "overview"],
  },
  {
    id: "help-digital-twin",
    category: "MY_STARTUP",
    title: { en: "What is the Digital Twin?", fr: "Qu'est-ce que le jumeau numérique ?" },
    body: {
      en: "My Startup holds your Digital Twin — the single structured source of truth for your identity, team, product, market, business model, traction, financials, funding and goals. Every other module (Readiness, Roadmap, Pitch Lab, Financials, Experts, Opportunities) reads from it rather than duplicating your profile. Profile Completion (a percentage of fields filled in) is intentionally separate from AFF Readiness (a quality assessment) — a startup can have a fully complete profile and still score low on readiness, or the reverse.",
      fr: "Ma Startup contient votre jumeau numérique — la source structurée unique de vérité pour votre identité, équipe, produit, marché, modèle économique, traction, finances, financement et objectifs. Tous les autres modules (Préparation, Feuille de route, Pitch Lab, Finances, Experts, Opportunités) le lisent plutôt que de dupliquer votre profil. L'achèvement du profil (un pourcentage de champs remplis) est volontairement distinct de la préparation AFF (une évaluation de qualité) — une startup peut avoir un profil entièrement complet et néanmoins obtenir un faible score de préparation, ou l'inverse.",
    },
    keywords: ["digital twin", "profile", "startup profile", "profile completion"],
  },
  {
    id: "help-readiness-scoring",
    category: "READINESS",
    title: { en: "Understanding AFF Readiness", fr: "Comprendre la préparation AFF" },
    body: {
      en: "AFF Readiness scores your startup across 10 dimensions (problem/market, product, business model, traction, team, finance, fundraising, operations, legal/governance, impact/ESG). Each dimension's score comes from explicit, weighted criteria evaluated against your answers and Digital Twin evidence — never an AI judgment. A dimension can be 'not applicable' if it genuinely doesn't apply yet at your stage. Readiness is diagnostic only: it never produces a 'fundable' verdict, a success probability, or an investment ranking, and it is never mutated automatically by Experts, Messages, Opportunities or Resources — only completing (or redoing) an assessment changes it.",
      fr: "La préparation AFF évalue votre startup selon 10 dimensions (problème/marché, produit, modèle économique, traction, équipe, finance, levée de fonds, opérations, juridique/gouvernance, impact/ESG). Le score de chaque dimension provient de critères explicites et pondérés évalués à partir de vos réponses et des preuves du jumeau numérique — jamais d'un jugement d'IA. Une dimension peut être « non applicable » si elle ne s'applique vraiment pas encore à votre stade. La préparation est purement diagnostique : elle ne produit jamais de verdict de « finançabilité », de probabilité de succès ou de classement d'investissement, et elle n'est jamais modifiée automatiquement par les modules Experts, Messages, Opportunités ou Ressources — seule la réalisation (ou la reprise) d'une évaluation la modifie.",
    },
    keywords: ["readiness", "score", "dimension", "assessment", "criteria"],
  },
  {
    id: "help-roadmap-tasks",
    category: "ROADMAP_TASKS",
    title: { en: "How your Roadmap and Tasks relate", fr: "Comment la feuille de route et les tâches sont liées" },
    body: {
      en: "Your Roadmap is a set of items generated from your latest completed Readiness assessment (or added by you), each traceable to a source (a readiness gap, a founder goal, an expert recommendation, an opportunity, a resource, and more — see each item's source badge). Tasks are the actionable steps under those items; Roadmap Progress is always derived at read time from your tasks' actual status, never stored as a stale number. Completing a task never silently changes your Readiness score — only a new assessment does.",
      fr: "Votre feuille de route est un ensemble d'éléments générés à partir de votre dernière évaluation de préparation complétée (ou ajoutés par vous), chacun traçable à une source (un écart de préparation, un objectif du fondateur, une recommandation d'expert, une opportunité, une ressource, etc. — voir le badge de source de chaque élément). Les tâches sont les étapes concrètes sous ces éléments ; l'avancement de la feuille de route est toujours calculé au moment de la lecture à partir du statut réel de vos tâches, jamais stocké comme un nombre obsolète. Terminer une tâche ne modifie jamais silencieusement votre score de préparation — seule une nouvelle évaluation le fait.",
    },
    keywords: ["roadmap", "tasks", "progress", "source type"],
  },
  {
    id: "help-pitch-lab",
    category: "PITCH",
    title: { en: "How Pitch Lab and Pitch Readiness work", fr: "Comment fonctionnent Pitch Lab et la préparation du pitch" },
    body: {
      en: "Pitch Lab holds versioned pitch decks built from your Digital Twin sections. Pitch Readiness is a separate score from AFF Readiness — it reflects whether your pitch sections are complete and addressed, not your overall startup quality. Review comments and Practice/Q&A sessions can each be converted into a Task with one click, and the same comment or gap can never generate two duplicate tasks.",
      fr: "Pitch Lab contient des présentations de pitch versionnées construites à partir des sections de votre jumeau numérique. La préparation du pitch est un score distinct de la préparation AFF — elle reflète si vos sections de pitch sont complètes et traitées, pas la qualité globale de votre startup. Les commentaires de révision et les sessions de pratique/Q&R peuvent chacun être convertis en tâche en un clic, et le même commentaire ou écart ne peut jamais générer deux tâches en double.",
    },
    keywords: ["pitch", "pitch lab", "pitch readiness", "practice", "qna"],
  },
  {
    id: "help-financials-runway",
    category: "FINANCIALS",
    title: { en: "How runway is calculated", fr: "Comment la trésorerie disponible est calculée" },
    body: {
      en: "Runway = current cash balance ÷ net monthly burn (monthly expenses minus monthly revenue). If your net burn is zero or negative, AFF shows 'sustainable' rather than a runway figure — that's a better state than a long countdown, not a missing one. If either your cash balance or a recent financial period is missing, AFF tells you exactly what's missing rather than guessing. Financial signals (e.g. 'runway below 3 months', 'revenue declining') are informational flags only — never investment advice, and never a factor in your AFF Readiness score.",
      fr: "Trésorerie disponible = solde de trésorerie actuel ÷ combustion mensuelle nette (dépenses mensuelles moins revenus mensuels). Si votre combustion nette est nulle ou négative, AFF affiche « viable » plutôt qu'un chiffre de trésorerie — c'est un meilleur état qu'un long compte à rebours, pas une donnée manquante. Si votre solde de trésorerie ou une période financière récente est manquant, AFF vous indique précisément ce qui manque plutôt que de deviner. Les signaux financiers (par ex. « trésorerie inférieure à 3 mois », « revenus en baisse ») sont de simples indicateurs informatifs — jamais un conseil d'investissement, ni un facteur de votre score de préparation AFF.",
    },
    keywords: ["runway", "burn", "financials", "cash", "financial signals"],
  },
  {
    id: "help-data-room-completion",
    category: "DATA_ROOM",
    title: { en: "Understanding Data Room Completion", fr: "Comprendre l'achèvement de la salle de données" },
    body: {
      en: "Data Room Completion = available (or verified) required documents ÷ total required documents for your stage. Outdated, needs-review and missing documents all count against completion until resolved. This is a document-readiness percentage only — it is never merged into, or confused with, your separate AFF Readiness score.",
      fr: "L'achèvement de la salle de données = documents requis disponibles (ou vérifiés) ÷ total des documents requis pour votre stade. Les documents obsolètes, à réviser ou manquants comptent tous contre l'achèvement jusqu'à leur résolution. Il s'agit uniquement d'un pourcentage de préparation documentaire — jamais fusionné avec, ni confondu avec, votre score de préparation AFF distinct.",
    },
    keywords: ["data room", "completion", "documents", "checklist"],
  },
  {
    id: "help-expert-matching",
    category: "EXPERTS",
    title: { en: "How expert matching works", fr: "Comment fonctionne la mise en relation avec les experts" },
    body: {
      en: "Expert relevance is shown as a plain-language list of reasons (expertise overlap, stage fit, industry experience, market familiarity, language, availability) — never a percentage or star rating. Support requests you send are visible only inside AFF (there is no real email delivery). A completed mentoring session's recommendations can be converted into a Task or added to your Roadmap, each guarded so the same recommendation can never create a duplicate.",
      fr: "La pertinence des experts est présentée sous forme de liste de raisons en langage clair (chevauchement d'expertise, adéquation au stade, expérience sectorielle, connaissance du marché, langue, disponibilité) — jamais un pourcentage ou une note en étoiles. Les demandes de soutien que vous envoyez sont visibles uniquement au sein d'AFF (il n'y a pas de véritable envoi d'e-mail). Les recommandations d'une session de mentorat terminée peuvent être converties en tâche ou ajoutées à votre feuille de route, chacune protégée pour qu'une même recommandation ne puisse jamais créer de doublon.",
    },
    keywords: ["experts", "mentoring", "matching", "support request"],
  },
  {
    id: "help-opportunities-matching",
    category: "OPPORTUNITIES",
    title: { en: "How opportunity relevance works", fr: "Comment fonctionne la pertinence des opportunités" },
    body: {
      en: "Opportunities (accelerators, grants, competitions and similar programs) show plain-language MATCH and MISMATCH reasons based on your Digital Twin's country, industry, stage and business model — never a percentage like '92% match'. Saved opportunities and application tracking are specific to the startup you're viewing. Application status (Interested, Preparing, Applied, Shortlisted, Accepted, Rejected, Withdrawn) is entered by you — AFF has no live connection to any external program and never claims to know a real external status.",
      fr: "Les opportunités (accélérateurs, subventions, concours et programmes similaires) affichent des raisons de correspondance et de non-correspondance en langage clair, fondées sur le pays, le secteur, le stade et le modèle économique de votre jumeau numérique — jamais un pourcentage du type « 92 % de correspondance ». Les opportunités enregistrées et le suivi des candidatures sont propres à la startup que vous consultez. Le statut de candidature (Intéressé, En préparation, Candidaté, Présélectionné, Accepté, Rejeté, Retiré) est saisi par vous — AFF n'a aucune connexion en direct avec un programme externe et ne prétend jamais connaître un statut externe réel.",
    },
    keywords: ["opportunities", "matching", "application", "grants", "accelerator"],
  },
  {
    id: "help-account-demo",
    category: "ACCOUNT",
    title: { en: "About your account and data in this version", fr: "À propos de votre compte et de vos données dans cette version" },
    body: {
      en: "This version of AFF uses a single demo sign-in and stores all data in memory on the server — nothing is saved to a permanent database yet, and data resets when the server restarts. There is no production authentication, billing, or real notification delivery. If you need help beyond this Help Center, use the contact option below — AFF does not have an automated ticket system, so messages go to the team's email directly.",
      fr: "Cette version d'AFF utilise une connexion de démonstration unique et stocke toutes les données en mémoire sur le serveur — rien n'est encore enregistré dans une base de données permanente, et les données sont réinitialisées au redémarrage du serveur. Il n'y a pas d'authentification de production, de facturation ni d'envoi de notifications réel. Si vous avez besoin d'aide au-delà de ce centre d'aide, utilisez l'option de contact ci-dessous — AFF n'a pas de système de tickets automatisé, les messages sont donc envoyés directement à l'e-mail de l'équipe.",
    },
    keywords: ["account", "demo", "data", "contact", "support"],
  },
];

export function getHelpArticle(id: string): HelpArticle | undefined {
  return helpArticles.find((a) => a.id === id);
}

export function listHelpArticles(): HelpArticle[] {
  return helpArticles;
}
