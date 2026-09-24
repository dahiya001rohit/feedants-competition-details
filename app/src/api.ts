import Constants from 'expo-constants';

export type Lang = 'en' | 'hi';
export type Phase = 'upcoming' | 'registration_open' | 'in_progress' | 'judging' | 'completed' | 'cancelled';
export type CountdownKey = 'registrationOpens' | 'registrationCloses' | 'submissionStarts' | 'submissionEnds' | 'results';

export interface Schedule {
  registrationOpensAt: string;
  registrationClosesAt: string;
  submissionStartsAt: string;
  submissionEndsAt: string;
  resultAt: string;
}

export interface CompetitionSummary {
  id: string;
  slug: string;
  status: 'published' | 'cancelled';
  phase: Phase;
  registrationOpen: boolean;
  submissionOpen: boolean;
  countdown: { key: CountdownKey; endsAt: string } | null;
  title: string;
  category: string;
  entryFee: number;
  currency: string;
  prizePool: number;
  capacity: number;
  bookedCount: number;
  spotsLeft: number;
  schedule: Schedule;
  registered?: boolean;
}

export interface Winner {
  name: string;
  position: number;
  photoUrl?: string;
  videoUrl?: string;
}

export interface Competition extends CompetitionSummary {
  tags: string[];
  certificateForWinners: boolean;
  judge: { name: string; title: string | null; experience: string | null; photoUrl?: string; introVideoUrl?: string };
  previousWinners: Winner[];
  about: string | null;
  judgingParameters: string | null;
  rules: string | null;
  rewards: { position: number; amount: number }[];
  disclaimer: string | null;
  refundPolicy: string | null;
  prizeInfoVideoUrl?: string;
}

export interface Viewer {
  registered: boolean;
  registeredAt: string | null;
  submission: { fileName: string; size: number; submittedAt: string } | null;
}

export interface CompetitionDetails {
  serverTime: string;
  competition: Competition;
  viewer: Viewer | null;
}

export interface MyRegistration {
  competition: CompetitionSummary;
  viewer: Viewer;
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  referral: { code: string; link: string; rewardPerSignup: number };
}

export interface Testimonial {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string | null;
  quote: string;
  rating?: number;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// On a device, reach the API on the same machine that serves the JS bundle.
const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${devHost ?? 'localhost'}:4000`;

let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('NETWORK', 0, 'Network request failed');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.error?.code ?? `HTTP_${res.status}`, res.status, body?.error?.message ?? 'Request failed');
  return body as T;
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  demoUsers: () => request<{ users: User[] }>('/api/auth/demo-users'),
  demoLogin: (userId: string) => request<{ token: string; user: User }>('/api/auth/demo-login', json({ userId })),
  competitions: (lang: Lang) =>
    request<{ serverTime: string; competitions: CompetitionSummary[] }>(`/api/competitions?lang=${lang}`),
  competition: (id: string, lang: Lang) => request<CompetitionDetails>(`/api/competitions/${id}?lang=${lang}`),
  register: (id: string, lang: Lang) =>
    request<CompetitionDetails>(`/api/competitions/${id}/registrations?lang=${lang}`, { method: 'POST' }),
  uploadSubmission: (id: string, lang: Lang, form: FormData) =>
    request<CompetitionDetails>(`/api/competitions/${id}/submission?lang=${lang}`, { method: 'PUT', body: form }),
  myRegistrations: (lang: Lang) =>
    request<{ serverTime: string; registrations: MyRegistration[] }>(`/api/me/registrations?lang=${lang}`),
  testimonials: (lang: Lang) => request<{ testimonials: Testimonial[] }>(`/api/testimonials?lang=${lang}`),
};
