"use client";

import { useState, useEffect, useCallback } from 'react';
import { Bot, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { adminAISettingsService, AISettingsDto } from '@/application/features/admin/adminAISettingsService';
import { getErrorMessage } from '@/shared/errors/errorMapper';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '0.375rem',
};

export default function AISettings() {
  const [settings, setSettings] = useState<AISettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [provider, setProvider] = useState('Gemini');
  const [enableExternal, setEnableExternal] = useState(false);
  const [model, setModel] = useState('gemini-1.5-flash');
  const [baseUrl, setBaseUrl] = useState('https://generativelanguage.googleapis.com/v1beta');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await adminAISettingsService.get();
      if (resp.data) {
        setSettings(resp.data);
        setProvider(resp.data.provider);
        setEnableExternal(resp.data.enableExternalProvider);
        setModel(resp.data.model);
        setBaseUrl(resp.data.baseUrl);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch AI settings', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchSettings);
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await adminAISettingsService.update({
        provider,
        enableExternalProvider: enableExternal,
        apiKey: apiKey || undefined,
        model,
        baseUrl,
      });
      setSuccess(true);
      setApiKey('');
      fetchSettings();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error('Failed to save AI settings', err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="w-7 h-7 text-blue-600" />
          AI Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure the AI recommendation provider and API credentials.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          AI settings saved successfully.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div>
          <label style={labelStyle}>AI Provider</label>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            style={inputStyle}
          >
            <option value="Gemini">Google Gemini</option>
            <option value="OpenAI">OpenAI</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Model</label>
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="e.g. gemini-1.5-flash"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="https://generativelanguage.googleapis.com/v1beta"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>
            API Key {settings?.hasApiKey && (
              <span className="text-xs text-emerald-600 ml-1">(configured)</span>
            )}
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={settings?.hasApiKey ? '•••••••••••• (leave blank to keep current)' : 'Enter API key'}
              style={{ ...inputStyle, paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <button
            type="button"
            onClick={() => setEnableExternal(!enableExternal)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enableExternal ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enableExternal ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-900">Enable External AI Provider</p>
            <p className="text-xs text-gray-500">
              When disabled, the system uses local keyword-based parsing only.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
