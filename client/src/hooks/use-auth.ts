import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PublicUser } from "@shared/models/auth";
import { apiFetch, setAuthToken } from "@/lib/api";

const AUTH_ME_KEY = ["/api/auth/me"];

type AuthResult = { token: string; user: PublicUser };
type ApiErrorPayload = { error?: { code?: string; message?: string }; message?: string };

type UpdateMeInput = {
  displayName?: string;
  whatsapp?: string;
  region?: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  placeId?: string;
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
  onboardingCompleted?: boolean;
};

function throwApiError(body: ApiErrorPayload, fallbackCode: string) {
  throw new Error(body?.error?.code ?? fallbackCode);
}

async function fetchUser(): Promise<PublicUser | null> {
  const response = await apiFetch("/api/auth/me");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("AUTH_LOAD_FAILED");
  return response.json();
}

async function signup(email: string, password: string, confirmPassword: string): Promise<AuthResult> {
  const response = await apiFetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, confirmPassword }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throwApiError(body, "SIGNUP_FAILED");
  }
  return response.json();
}

async function login(email: string, password: string): Promise<AuthResult> {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throwApiError(body, "INVALID_CREDENTIALS");
  }
  return response.json();
}

async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await apiFetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throwApiError(body, "FORGOT_PASSWORD_FAILED");
  }

  return response.json();
}

async function resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
  const response = await apiFetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throwApiError(body, "RESET_PASSWORD_FAILED");
  }

  return response.json();
}

async function googleAuth(idToken: string): Promise<AuthResult> {
  const response = await apiFetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throwApiError(body, "INVALID_GOOGLE_TOKEN");
  }
  return response.json();
}

async function updateMe(data: UpdateMeInput): Promise<PublicUser> {
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

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: ({ token, user }) => {
      setAuthToken(token);
      queryClient.setQueryData(AUTH_ME_KEY, user);
    },
  });

  const signupMutation = useMutation({
    mutationFn: ({ email, password, confirmPassword }: { email: string; password: string; confirmPassword: string }) => signup(email, password, confirmPassword),
    onSuccess: ({ token, user }) => {
      setAuthToken(token);
      queryClient.setQueryData(AUTH_ME_KEY, user);
    },
  });

  const forgotPasswordMutation = useMutation({ mutationFn: forgotPassword });
  const resetPasswordMutation = useMutation({ mutationFn: ({ email, otp, newPassword }: { email: string; otp: string; newPassword: string }) => resetPassword(email, otp, newPassword) });

  const googleMutation = useMutation({
    mutationFn: ({ idToken }: { idToken: string }) => googleAuth(idToken),
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
    loginWithPassword: loginMutation.mutateAsync,
    signupWithPassword: signupMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    loginWithGoogle: googleMutation.mutateAsync,
    updateMe: updateMeMutation.mutateAsync,
    isLoggingInWithPassword: loginMutation.isPending,
    isSigningUpWithPassword: signupMutation.isPending,
    isForgettingPassword: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isGoogleLoading: googleMutation.isPending,
    isUpdatingMe: updateMeMutation.isPending,
    logout,
  };
}
