import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import type { PickedVideo } from './lib/upload';

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
  maxUploadBytes: number;
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
        ...authHeaders(),
        ...init.headers,
      },
    });
  } catch (e) {
    if (__DEV__) console.warn(`[api] ${init.method ?? 'GET'} ${path} failed:`, String(e));
    throw new ApiError('NETWORK', 0, 'Network request failed');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw toApiError(res.status, body);
  return body as T;
}

const authHeaders = (): Record<string, string> => (authToken ? { Authorization: `Bearer ${authToken}` } : {});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toApiError(status: number, body: any) {
  return new ApiError(body?.error?.code ?? `HTTP_${status}`, status, body?.error?.message ?? 'Request failed');
}

// On a device the native uploader streams the video from disk; fetch + FormData would load the whole
// file into memory (and fails outright for some iOS video files). Browsers have no file path, so web uses FormData.
async function uploadVideo(path: string, video: PickedVideo): Promise<CompetitionDetails> {
  if (Platform.OS === 'web') {
    const form = new FormData();
    form.append('video', video.file ?? (await (await fetch(video.uri)).blob()), video.name);
    return request<CompetitionDetails>(path, { method: 'PUT', body: form });
  }
  let res: FileSystem.FileSystemUploadResult;
  try {
    res = await FileSystem.uploadAsync(API_URL + path, video.uri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'video',
      mimeType: video.type,
      headers: { Accept: 'application/json', ...authHeaders() },
    });
  } catch (e) {
    if (__DEV__) console.warn(`[api] upload ${path} failed:`, String(e));
    throw new ApiError('NETWORK', 0, 'Network request failed');
  }
  let body = null;
  try {
    body = JSON.parse(res.body);
  } catch {
    // non-JSON body (e.g. a proxy error page); status code decides below
  }
  if (res.status >= 400) throw toApiError(res.status, body);
  return body as CompetitionDetails;
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
  uploadSubmission: (id: string, lang: Lang, video: PickedVideo) =>
    uploadVideo(`/api/competitions/${id}/submission?lang=${lang}`, video),
  myRegistrations: (lang: Lang) =>
    request<{ serverTime: string; registrations: MyRegistration[] }>(`/api/me/registrations?lang=${lang}`),
  testimonials: (lang: Lang) => request<{ testimonials: Testimonial[] }>(`/api/testimonials?lang=${lang}`),
};
