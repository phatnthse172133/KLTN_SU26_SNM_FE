"use client";

import { FormEvent, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/application/context/AuthContext";
import { accountService } from "@/application/features/account/accountService";
import { getErrorMessage, isAppError } from "@/shared/errors/errorMapper";

export default function BoothOwnerChangePasswordPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmNewPassword?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    const nextFieldErrors: { currentPassword?: string; newPassword?: string; confirmNewPassword?: string } = {};
    if (!currentPassword) nextFieldErrors.currentPassword = "Temporary password is required.";
    if (!newPassword) nextFieldErrors.newPassword = "New password is required.";
    else if (newPassword.length < 6) nextFieldErrors.newPassword = "Your new password must be at least 6 characters.";
    if (!confirmNewPassword) nextFieldErrors.confirmNewPassword = "Please confirm your new password.";
    else if (newPassword && newPassword !== confirmNewPassword) nextFieldErrors.confirmNewPassword = "The new passwords do not match.";
    if (newPassword && currentPassword && newPassword === currentPassword) nextFieldErrors.newPassword = "New password must be different from the current password.";
    if (Object.keys(nextFieldErrors).length > 0) { setFieldErrors(nextFieldErrors); return; }
    setSaving(true);
    try {
      await accountService.changePassword({ currentPassword, newPassword, confirmNewPassword });
      await logout();
    } catch (changeError) {
      if (isAppError(changeError)) {
        const backendFieldErrors = changeError.fieldErrors ?? {};
        const nextErrors: { currentPassword?: string; newPassword?: string; confirmNewPassword?: string } = {};
        if (changeError.code === "CURRENT_PASSWORD_INVALID") nextErrors.currentPassword = changeError.message;
        else if (backendFieldErrors.currentPassword?.[0]) nextErrors.currentPassword = backendFieldErrors.currentPassword[0];
        if (changeError.code === "PASSWORD_REUSE_NOT_ALLOWED") nextErrors.newPassword = changeError.message;
        else if (backendFieldErrors.newPassword?.[0]) nextErrors.newPassword = backendFieldErrors.newPassword[0];
        if (backendFieldErrors.confirmNewPassword?.[0]) nextErrors.confirmNewPassword = backendFieldErrors.confirmNewPassword[0];
        if (Object.keys(nextErrors).length > 0) setFieldErrors(nextErrors);
        else setError(changeError.message);
      } else {
        setError(getErrorMessage(changeError));
      }
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Set your personal password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This account was created with a temporary password. Change it before accessing Booth Owner features.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700">
            Temporary password
            <input
              required
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {fieldErrors.currentPassword && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {fieldErrors.currentPassword}
              </p>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            New password
            <input
              required
              minLength={6}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {fieldErrors.newPassword && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {fieldErrors.newPassword}
              </p>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Confirm new password
            <input
              required
              minLength={6}
              type="password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {fieldErrors.confirmNewPassword && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {fieldErrors.confirmNewPassword}
              </p>
            )}
          </label>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Lock className="h-4 w-4" />
            {saving ? "Saving..." : "Change password"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => router.replace("/boothowner/login")}
          className="mt-4 w-full text-sm text-slate-500 hover:text-slate-800"
        >
          Back to sign in
        </button>
      </div>
    </main>
  );
}
