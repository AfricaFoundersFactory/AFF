export type SubmissionResult = { ok: true } | { ok: false; error: string };

export type JoinCommunityFormData = {
  role: string;
  name: string;
  email: string;
  country: string;
  startup: string;
  sector: string;
  stage: string;
  description: string;
  challenge: string;
  why: string;
};

export type ApplyToPitchFormData = {
  founder: string;
  startup: string;
  country: string;
  sector: string;
  stage: string;
  website: string;
  oneLiner: string;
  problem: string;
  solution: string;
  traction: string;
  challenge: string;
  video: string;
  linkedin: string;
  question: string;
};
