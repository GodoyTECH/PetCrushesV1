import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { apiFetch, setAuthToken } from "@/lib/api";

const AUTH_ME_KEY = ["/api/auth/me"];

type VerifyOtpResult = { token: string; user: User; isNewUser: boolean };
type RequestOtpResult = {
  ok: boolean;
  expiresAt: string;
  delivery: { delivered: boolean; provider: "resend" | "dev-console" };
};

type ApiErrorPayload = { error?: { code?: string; message?: string }; message?: string };

type UpdateMeInput = {
  displayName?: string;
  whatsapp?: string;
  region?: string;
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
  onboardingCompleted?: boolean;
};

function throwApiError(body: ApiErrorPayload, fallbackCode: string) {
  throw new Error(body?.error?.code ?? fallbackCode);
}

async function fetchUser(): Promise<User | null> {
  const response = await apiFetch("/api/auth/me");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return response.json();
}

async function checkAuthExists(email: string): Promise<{ exists: boolean }> {
  const response = await apiFetch(`/api/auth/exists?email=${encodeURIComponent(email)}`);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throwApiError(body, "INVALID_EMAIL");
  }

  return response.json();
}

async function requestOtp(email: string): Promise<RequestOtpResult> {
  const response = await apiFetch("/api/auth/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throwApiError(body, "OTP_REQUEST_FAILED");
  }

  return response.json();
}

async function verifyOtp(email: string, code: string): Promise<VerifyOtpResult> {
  const response = await apiFetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throwApiError(body, "OTP_INVALID_OR_EXPIRED");
  }

  return response.json();
}

async function updateMe(data: UpdateMeInput): Promise<User> {
  const response = await apiFetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throwApiError(body, "PROFILE_UPDATE_FAILED");
  }

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: AUTH_ME_KEY, queryFn: fetchUser, retry: false });

  const requestOtpMutation = useMutation({ mutationFn: requestOtp });
  const existsMutation = useMutation({ mutationFn: checkAuthExists });
  const verifyOtpMutation = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => verifyOtp(email, code),
    onSuccess: ({ token, user }) => {
      setAuthToken(token);
      queryClient.setQueryData(AUTH_ME_KEY, user);
    },
  });

  const updateMeMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_ME_KEY, user);
    },
  });

  const logout = () => {
    setAuthToken(null);
    queryClient.setQueryData(AUTH_ME_KEY, null);
  };

  return {
    user: query.data,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    checkAuthExists: existsMutation.mutateAsync,
    requestOtp: requestOtpMutation.mutateAsync,
    verifyOtp: verifyOtpMutation.mutateAsync,
    updateMe: updateMeMutation.mutateAsync,
    isCheckingExists: existsMutation.isPending,
    isRequestingOtp: requestOtpMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    isUpdatingMe: updateMeMutation.isPending,
    logout,
  };
}
