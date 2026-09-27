export type ScoreDimension = {
  label: string;
  pct: number;
};

export type ActionCard = {
  title: string;
  score: number;
  status: string;
  gap: string;
  action: string;
  resource: string;
};

export type AssessmentPoint = {
  label: string;
  value: number;
};

export type CategoryEvolution = {
  label: string;
  from: number;
  to: number;
};
