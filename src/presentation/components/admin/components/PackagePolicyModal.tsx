"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Plus, CheckCircle, Clock, FileText,
  ArrowUp, ArrowDown, Trash2, Eye, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { packageService } from "@/application/features/packages/packageService";
import type { PackagePolicy } from "@/shared/types";
import { Modal } from "./Modal";
import { useToast } from "@/presentation/components/shared/ToastContext";
import { getErrorMessage } from "@/shared/errors/errorMapper";

interface PackagePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  packageName: string;
}

interface PolicyForm {
  title: string;
  terms: string[];
  effectiveFrom: string;
}

const EMPTY_FORM: PolicyForm = {
  title: "",
  terms: [""],
  effectiveFrom: "",
};

export function PackagePolicyModal({ isOpen, onClose, packageId, packageName }: PackagePolicyModalProps) {
  const [policies, setPolicies] = useState<PackagePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [confirmActivateId, setConfirmActivateId] = useState<string | null>(null);
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [form, setForm] = useState<PolicyForm>(EMPTY_FORM);
  const [editingFromPolicy, setEditingFromPolicy] = useState<PackagePolicy | null>(null);
  const { showToast } = useToast();

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await packageService.getPolicyVersions(packageId);
      if (res.success && res.data) {
        setPolicies(res.data);
      } else {
        setLoadError("Failed to load policy versions. Please try again.");
      }
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(() => {
        setShowCreateForm(false);
        setShowPreview(false);
        setEditingFromPolicy(null);
        setLoadError(null);
        return fetchPolicies();
      });
    }
  }, [isOpen, fetchPolicies]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowCreateForm(false);
    setShowPreview(false);
    setEditingFromPolicy(null);
  };

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setEditingFromPolicy(null);
    setShowCreateForm(true);
    setShowPreview(false);
  };

  const openNewVersionFromExisting = (policy: PackagePolicy) => {
    setForm({
      title: policy.title,
      terms: policy.terms.length > 0 ? [...policy.terms] : [""],
      effectiveFrom: "",
    });
    setEditingFromPolicy(policy);
    setShowCreateForm(true);
    setShowPreview(false);
  };

  const validateForm = (): string | null => {
    const title = form.title.trim();
    if (title.length < 5 || title.length > 200)
      return "Policy title must be between 5 and 200 characters.";

    const trimmedTerms = form.terms.map((t) => t.trim()).filter((t) => t.length > 0);
    if (trimmedTerms.length === 0)
      return "At least one policy term is required.";

    const lowerSet = new Set(trimmedTerms.map((t) => t.toLowerCase()));
    if (lowerSet.size !== trimmedTerms.length)
      return "Duplicate policy terms are not allowed.";

    if (!form.effectiveFrom)
      return "Please select an effective date and time.";

    const date = new Date(form.effectiveFrom);
    if (isNaN(date.getTime()))
      return "Please enter a valid effective date and time.";

    return null;
  };

  const handleCreate = async () => {
    const error = validateForm();
    if (error) {
      showToast("error", error);
      return;
    }

    const trimmedTerms = form.terms.map((t) => t.trim()).filter((t) => t.length > 0);
    const effectiveFromISO = new Date(form.effectiveFrom).toISOString();

    setSubmitting(true);
    try {
      const res = await packageService.createPolicy(packageId, {
        title: form.title.trim(),
        terms: trimmedTerms,
        effectiveFrom: effectiveFromISO,
      });
      if (res.success) {
        showToast("success", "Policy version created successfully.");
        resetForm();
        fetchPolicies();
      } else {
        showToast("error", "The policy could not be created. Please review the form and try again.");
      }
    } catch (err) {
      showToast("error", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (policyId: string) => {
    setActivatingId(policyId);
    try {
      const res = await packageService.activatePolicy(packageId, policyId);
      if (res.success) {
        showToast("success", "Policy activated successfully.");
        setConfirmActivateId(null);
        fetchPolicies();
      } else {
        showToast("error", "The policy could not be activated. Please refresh and try again.");
      }
    } catch (err) {
      showToast("error", getErrorMessage(err));
    } finally {
      setActivatingId(null);
    }
  };

  const addTerm = () => {
    setForm({ ...form, terms: [...form.terms, ""] });
  };

  const removeTerm = (index: number) => {
    setForm({ ...form, terms: form.terms.filter((_, i) => i !== index) });
  };

  const updateTerm = (index: number, value: string) => {
    const newTerms = [...form.terms];
    newTerms[index] = value;
    setForm({ ...form, terms: newTerms });
  };

  const moveTerm = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= form.terms.length) return;
    const newTerms = [...form.terms];
    [newTerms[index], newTerms[newIndex]] = [newTerms[newIndex], newTerms[index]];
    setForm({ ...form, terms: newTerms });
  };

  const getStatusLabel = (policy: PackagePolicy): { label: string; bg: string; color: string } => {
    if (policy.isActive) return { label: "Active", bg: "#D1FAE5", color: "#065F46" };
    const effectiveDate = new Date(policy.effectiveFrom);
    const now = new Date();
    if (effectiveDate > now) {
      return {
        label: `Available for activation on ${effectiveDate.toLocaleDateString()}`,
        bg: "#FEF3C7",
        color: "#92400E",
      };
    }
    return { label: "Not Active", bg: "#F3F4F6", color: "#64748B" };
  };

  const canActivate = (policy: PackagePolicy) => {
    return !policy.isActive && new Date(policy.effectiveFrom) <= new Date();
  };

  const formError = validateForm();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Policy Versions - ${packageName}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Manage terms and conditions, upgrade/downgrade, renewal, cancellation, and refund policies.
          </p>
          {!showCreateForm && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "#2563EB", color: "#FFFFFF" }}
            >
              <Plus className="w-4 h-4" />
              New Version
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="rounded-xl border border-gray-200 p-4 space-y-4" style={{ background: "#F9FAFB" }}>
            {editingFromPolicy && (
              <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: "#DBEAFE" }}>
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Creating a new version based on {editingFromPolicy.displayVersion}. The original policy will not be modified.
                </span>
              </div>
            )}

            {!showPreview ? (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600">Policy Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Market Pro Subscription Policy"
                    maxLength={200}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">{form.title.trim().length}/200 characters</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Policy Terms *</label>
                  <div className="mt-1 space-y-2">
                    {form.terms.map((term, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <textarea
                          value={term}
                          onChange={(e) => updateTerm(index, e.target.value)}
                          placeholder={`Term ${index + 1}: Enter a policy clause in plain English...`}
                          rows={2}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500 resize-y"
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveTerm(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTerm(index, "down")}
                            disabled={index === form.terms.length - 1}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTerm(index)}
                            disabled={form.terms.length === 1}
                            className="p-1 rounded text-red-400 hover:text-red-600 disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addTerm}
                    className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Term
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Effective Date and Time *</label>
                  <input
                    type="datetime-local"
                    value={form.effectiveFrom}
                    onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The policy can only be activated on or after this date and time.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowPreview(true)}
                    disabled={formError !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ background: "#6B7280", color: "#FFFFFF" }}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-bold text-gray-900">{form.title.trim()}</h3>
                  </div>
                  <div className="space-y-2">
                    {form.terms.map((term, index) => {
                      const trimmed = term.trim();
                      if (!trimmed) return null;
                      return (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm font-medium text-gray-400 mt-0.5">{index + 1}.</span>
                          <p className="text-sm leading-6 text-gray-700">{trimmed}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Effective from: {form.effectiveFrom ? new Date(form.effectiveFrom).toLocaleString() : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ background: "#2563EB", color: "#FFFFFF" }}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save as New Version
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {loadError && !loading && (
          <div className="rounded-xl border p-4 flex items-center justify-between gap-3" style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{loadError}</span>
            </div>
            <button
              onClick={() => void fetchPolicies()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No policy versions yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {policies.map((policy) => {
              const status = getStatusLabel(policy);
              return (
                <div
                  key={policy.id}
                  className="rounded-xl border p-4 flex items-start gap-3"
                  style={{
                    borderColor: policy.isActive ? "#10B981" : "#E5E7EB",
                    background: policy.isActive ? "#F0FDF4" : "#FFFFFF",
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {policy.isActive ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{policy.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: policy.isActive ? "#D1FAE5" : "#F3F4F6", color: policy.isActive ? "#065F46" : "#64748B" }}>
                        {policy.displayVersion}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Effective: {new Date(policy.effectiveFrom).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedPolicyId(expandedPolicyId === policy.id ? null : policy.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <FileText className="w-3 h-3" />
                        {expandedPolicyId === policy.id ? "Hide terms" : "View terms"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openNewVersionFromExisting(policy)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-3 h-3" />
                        Create New Version
                      </button>
                    </div>
                    {expandedPolicyId === policy.id && (
                      <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                        {policy.terms.length > 0 ? (
                          <div className="space-y-2">
                            {policy.terms.map((term, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-sm font-medium text-gray-400 mt-0.5">{idx + 1}.</span>
                                <p className="text-sm leading-6 text-gray-700">{term}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">Policy content is unavailable.</p>
                        )}
                      </div>
                    )}
                  </div>
                  {canActivate(policy) && (
                    <button
                      onClick={() => setConfirmActivateId(policy.id)}
                      disabled={activatingId === policy.id}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      style={{ background: "#2563EB", color: "#FFFFFF" }}
                    >
                      {activatingId === policy.id ? "Activating..." : "Activate"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmActivateId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "#FFFFFF" }}>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-gray-900">Activate Policy</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This policy will apply to new purchases and renewals after activation. Existing subscriptions will retain the policy version they previously accepted.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmActivateId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleActivate(confirmActivateId)}
                disabled={activatingId === confirmActivateId}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: "#2563EB", color: "#FFFFFF" }}
              >
                {activatingId === confirmActivateId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm Activation
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
