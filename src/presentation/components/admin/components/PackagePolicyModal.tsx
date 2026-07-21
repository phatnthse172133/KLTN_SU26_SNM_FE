"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Plus, CheckCircle, Clock, FileText } from "lucide-react";
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

export function PackagePolicyModal({ isOpen, onClose, packageId, packageName }: PackagePolicyModalProps) {
  const [policies, setPolicies] = useState<PackagePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    version: "",
    title: "",
    content: "",
    effectiveMode: "immediate" as "immediate" | "scheduled",
    effectiveFrom: "",
  });
  const { showToast } = useToast();

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await packageService.getPolicyVersions(packageId);
      if (res.success && res.data) {
        setPolicies(res.data);
      }
    } catch (err) {
      showToast("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [packageId, showToast]);

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(() => {
        setShowCreateForm(false);
        return fetchPolicies();
      });
    }
  }, [isOpen, fetchPolicies]);

  const handleCreate = async () => {
    if (!form.version.trim() || !form.title.trim() || !form.content.trim()) {
      showToast("error", "Version, title, and content are required.");
      return;
    }
    const plainContent = form.content.trim();
    try {
      const effectiveFromISO =
        form.effectiveMode === "immediate"
          ? new Date().toISOString()
          : form.effectiveFrom
            ? new Date(form.effectiveFrom).toISOString()
            : null;
      if (form.effectiveMode === "scheduled" && !form.effectiveFrom) {
        showToast("error", "Please select an effective date and time.");
        return;
      }
      const res = await packageService.createPolicy(packageId, {
        version: form.version.trim(),
        title: form.title.trim(),
        contentJson: JSON.stringify({ terms: plainContent }),
        contentMarkdown: plainContent,
        effectiveFrom: effectiveFromISO,
      });
      if (res.success) {
        showToast("success", "Policy version created successfully.");
        setForm({ version: "", title: "", content: "", effectiveMode: "immediate", effectiveFrom: "" });
        setShowCreateForm(false);
        fetchPolicies();
      } else {
        showToast("error", "The policy could not be created. Please review the form and try again.");
      }
    } catch (err) {
      showToast("error", getErrorMessage(err));
    }
  };

  const handleActivate = async (policyId: string) => {
    setActivatingId(policyId);
    try {
      const res = await packageService.activatePolicy(packageId, policyId);
      if (res.success) {
        showToast("success", "Policy activated successfully.");
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Policy Versions â€” ${packageName}`} size="lg">
      <div className="space-y-4">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Manage terms and conditions, upgrade/downgrade, renewal, cancellation, and refund policies.
          </p>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: "#2563EB", color: "#FFFFFF" }}
          >
            <Plus className="w-4 h-4" />
            New Version
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="rounded-xl border border-gray-200 p-4 space-y-3" style={{ background: "#F9FAFB" }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Version *</label>
                <input
                  type="text"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  placeholder="e.g. 1.0, 2.0"
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Policy title"
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Terms and Conditions *</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Enter the subscription term, renewal, upgrade, downgrade, cancellation and refund rules in plain English."
                rows={9}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Write the policy in clear English so package owners can understand it before purchase.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Effective Date</label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="effectiveMode"
                    value="immediate"
                    checked={form.effectiveMode === "immediate"}
                    onChange={(e) => setForm({ ...form, effectiveMode: e.target.value as "immediate" | "scheduled" })}
                  />
                  Effective immediately
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="effectiveMode"
                    value="scheduled"
                    checked={form.effectiveMode === "scheduled"}
                    onChange={(e) => setForm({ ...form, effectiveMode: e.target.value as "immediate" | "scheduled" })}
                  />
                  Schedule for later
                </label>
              </div>
              {form.effectiveMode === "scheduled" && (
                <input
                  type="datetime-local"
                  value={form.effectiveFrom}
                  onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "#2563EB", color: "#FFFFFF" }}
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Policy List */}
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No policy versions yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {policies.map((policy) => (
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{policy.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: policy.isActive ? "#D1FAE5" : "#F3F4F6", color: policy.isActive ? "#065F46" : "#64748B" }}>
                      v{policy.version}
                    </span>
                    {policy.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#D1FAE5", color: "#065F46" }}>
                        Active
                      </span>
                    )}
                    {!policy.isActive && new Date(policy.effectiveFrom) > new Date() && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FEF3C7", color: "#92400E" }}>
                        Scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Effective: {new Date(policy.effectiveFrom).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedPolicyId(expandedPolicyId === policy.id ? null : policy.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <FileText className="w-3 h-3" />
                      {expandedPolicyId === policy.id ? "Hide terms" : "View terms"}
                    </button>
                  </div>
                  {expandedPolicyId === policy.id && (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {getReadablePolicyContent(policy)}
                      </p>
                    </div>
                  )}
                </div>
                {!policy.isActive && (
                  <button
                    onClick={() => handleActivate(policy.id)}
                    disabled={activatingId === policy.id || new Date(policy.effectiveFrom) > new Date()}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    style={{ background: "#2563EB", color: "#FFFFFF" }}
                  >
                    {activatingId === policy.id ? "Activating..." : new Date(policy.effectiveFrom) > new Date() ? "Not yet effective" : "Activate"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function getReadablePolicyContent(policy: PackagePolicy) {
  if (policy.contentMarkdown?.trim()) return policy.contentMarkdown.trim();

  try {
    const parsed = JSON.parse(policy.contentJson) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const terms = (parsed as Record<string, unknown>).terms;
      if (typeof terms === "string" && terms.trim()) return terms.trim();
    }
  } catch {
    // Older policy snapshots may not contain valid JSON. Keep the UI user-friendly.
  }

  return "Policy content is unavailable.";
}
