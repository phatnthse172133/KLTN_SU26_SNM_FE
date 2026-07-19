"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Eye, Brain, Bot, FileJson, 
  MessageSquare, User
} from 'lucide-react';
import { Modal } from './components/Modal';
import { Pagination } from './components/Pagination';
import { 
  adminAILogService, 
  AILog, 
  AIRecommendationType 
} from '@/application/features/admin/adminAILogService';
import { format } from 'date-fns';

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  boxShadow: '0 4px 32px rgba(15,23,42,0.06)',
  borderRadius: '1rem',
  overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
  padding: '1rem 1.5rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: '#F8FAFC',
  borderBottom: '1px solid #E5E7EB',
};

const tdStyle: React.CSSProperties = {
  padding: '1rem 1.5rem',
  fontSize: '0.875rem',
  color: '#1E293B',
  borderBottom: '1px solid #E5E7EB',
};

export default function AILogs() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedType, setSelectedType] = useState<AIRecommendationType | 'All'>('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAILogService.getLogs({
        page,
        limit,
        search: debouncedSearch,
        type: selectedType === 'All' ? undefined : selectedType
      });
      if (data?.data) {
        setLogs(data.data.items || []);
        setTotalCount(data.data.totalCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch AI logs', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const openModal = (log: AILog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const getTypeName = (type: AIRecommendationType) => {
    switch (type) {
      case AIRecommendationType.General: return 'General';
      case AIRecommendationType.ByBudget: return 'By Budget';
      case AIRecommendationType.ByFoodTags: return 'By Tags';
      case AIRecommendationType.ByCombo: return 'By Combo';
      default: return 'Unknown';
    }
  };

  const getTypeIcon = (type: AIRecommendationType) => {
    switch (type) {
      case AIRecommendationType.General: return <Bot className="w-4 h-4" />;
      case AIRecommendationType.ByBudget: return <MessageSquare className="w-4 h-4" />;
      case AIRecommendationType.ByFoodTags: return <Brain className="w-4 h-4" />;
      case AIRecommendationType.ByCombo: return <FileJson className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Recommendation Logs</h1>
          <p className="text-slate-500 mt-1">Monitor AI recommendation history and intents</p>
        </div>
      </div>

      <div style={cardStyle}>
        {/* Filters */}
        <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {['All', AIRecommendationType.General, AIRecommendationType.ByBudget, AIRecommendationType.ByFoodTags, AIRecommendationType.ByCombo].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedType(tab as AIRecommendationType | 'All')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedType === tab 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'All' ? 'All Types' : getTypeName(tab as AIRecommendationType)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Input</th>
                <th style={thStyle} className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 mt-2 text-sm">Loading logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No AI logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td style={tdStyle}>
                      <span className="text-sm text-slate-600 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            {log.customerName || 'Anonymous'}
                          </p>
                          {log.customerEmail && (
                            <p className="text-xs text-slate-500">{log.customerEmail}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                          {getTypeIcon(log.recommendationType)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {getTypeName(log.recommendationType)}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div className="max-w-[250px] md:max-w-xs lg:max-w-md">
                        <p className="text-sm text-slate-600 truncate font-mono bg-slate-50 px-2 py-1 rounded">
                          {log.inputJson}
                        </p>
                      </div>
                    </td>
                    <td style={tdStyle} className="text-right">
                      <button 
                        onClick={() => openModal(log)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="border-t border-gray-200 bg-white px-5 py-4">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(totalCount / limit)}
              totalItems={totalCount}
              itemsPerPage={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="AI Log Details"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Customer</p>
                <p className="text-sm font-medium text-slate-900">{selectedLog.customerName || 'Anonymous'}</p>
                {selectedLog.customerEmail && <p className="text-xs text-slate-500">{selectedLog.customerEmail}</p>}
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Time & Type</p>
                <p className="text-sm font-medium text-slate-900">{format(new Date(selectedLog.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                <p className="text-xs text-slate-500">{getTypeName(selectedLog.recommendationType)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Raw Input
              </h3>
              <pre className="text-xs bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap">
                {selectedLog.inputJson}
              </pre>
            </div>

            {selectedLog.parsedIntentJson && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  Parsed Intent
                </h3>
                <pre className="text-xs bg-purple-50 text-purple-900 p-4 rounded-xl overflow-x-auto font-mono border border-purple-100 whitespace-pre-wrap">
                  {selectedLog.parsedIntentJson}
                </pre>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-400" />
                AI Output
              </h3>
              <pre className="text-xs bg-slate-50 text-slate-700 p-4 rounded-xl overflow-x-auto font-mono border border-slate-200 whitespace-pre-wrap max-h-60">
                {selectedLog.resultJson}
              </pre>
            </div>

            {selectedLog.selectedOptionId && (
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Selected Option</p>
                <p className="text-sm font-medium text-emerald-900">Not available</p>
              </div>
            )}

          </div>
        )}
      </Modal>
    </div>
  );
}
