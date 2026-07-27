import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Bell, RefreshCw, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { adminNotificationService, AdminNotificationListItemResponse, AdminCreateNotificationRequest, AdminNotificationDetailResponse } from '@/application/features/notifications/adminNotificationService';
import { accountService } from '@/application/features/account/accountService';
import { getErrorMessage } from '@/shared/errors/errorMapper';

const TARGET_OPTIONS = [
  { value: 'AllUsers', label: 'All Users' },
  { value: 'Role', label: 'By Role' },
  { value: 'SpecificUser', label: 'Specific User' }
];

const ROLE_OPTIONS = [
  { value: 'Customer', label: 'Customer' },
  { value: 'BoothOwner', label: 'Booth Owner' },
  { value: 'MarketOwner', label: 'Market Owner' }
];

export function NotificationsManagement() {
  const [items, setItems] = useState<AdminNotificationListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [target, setTarget] = useState('');
  const [role, setRole] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Confirmation state
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState<AdminCreateNotificationRequest>({
    target: 'AllUsers',
    title: '',
    content: ''
  });

  // User search for SpecificUser
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<{id: string, name: string, email: string}[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [userSearchRetryKey, setUserSearchRetryKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string, email: string} | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // View Detail Modal
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<AdminNotificationDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const loadData = async () => {
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setListError('From Date must be earlier than or equal to To Date.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setListError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await adminNotificationService.getAdminNotifications({
        page,
        pageSize,
        keyword: keyword || undefined,
        target: target || undefined,
        role: role || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      }, controller.signal);
      setItems(res.items);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setListError(getErrorMessage(err));
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, target, role, fromDate, toDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  // Debounced User Search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!userSearchTerm.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingUsers(true);
      setUserSearchError(null);
      try {
        const res = await accountService.getUsers(1, 10, userSearchTerm);
        setUserSearchResults(res.data.items.map(u => ({ id: u.id, name: u.fullName, email: u.email })));
      } catch (err: unknown) {
        setUserSearchResults([]);
        setUserSearchError(getErrorMessage(err));
      } finally {
        setIsSearchingUsers(false);
      }
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [userSearchTerm, userSearchRetryKey]);

  const initiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.target === 'SpecificUser' && !formData.userId) {
      setFormError('Please select a valid user.');
      return;
    }
    setFormError(null);
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setFormError(null);
    setShowConfirm(false);
    try {
      await adminNotificationService.createNotification(formData);
      setIsCreateModalOpen(false);
      setFormData({
        target: 'AllUsers',
        title: '',
        content: ''
      });
      setUserSearchTerm('');
      setSelectedUser(null);
      setPage(1);
      loadData();
      showToast('Notification sent successfully.', 'success');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (batchId: string) => {
    setSelectedBatchId(batchId);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await adminNotificationService.getAdminNotificationDetail(batchId);
      setDetailData(data);
    } catch (err: unknown) {
      setDetailError(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedBatchId(null);
    setDetailData(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="flex-shrink-0 px-8 py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and send push notifications to users.</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Send Notification
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {listError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-center justify-between">
            <span className="text-red-600 text-sm">{listError}</span>
            <button onClick={() => loadData()} className="px-4 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200">
              Retry
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="Search by title or content..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <select
                value={target}
                onChange={e => {
                  setTarget(e.target.value);
                  if (e.target.value !== 'Role') setRole('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm"
              >
                <option value="">All Targets</option>
                {TARGET_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {target === 'Role' && (
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm"
                >
                  <option value="">All Roles</option>
                  {ROLE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                setTarget('');
                setRole('');
                setFromDate('');
                setToDate('');
                setPage(1);
              }}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              Clear
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-900 font-medium">
                <tr>
                  <th className="px-6 py-4">Title / Content</th>
                  <th className="px-6 py-4 w-32">Type</th>
                  <th className="px-6 py-4 w-40">Target</th>
                  <th className="px-6 py-4 w-24 text-center">Recipients</th>
                  <th className="px-6 py-4 w-40">Created By</th>
                  <th className="px-6 py-4 w-40">Date</th>
                  <th className="px-6 py-4 w-24 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                      Loading notifications...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                      No notifications found
                    </td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.batchId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 cursor-pointer" onClick={() => openDetail(item.batchId)}>
                        <div className="font-medium text-gray-900 mb-1">{item.title}</div>
                        <div className="text-gray-500 truncate max-w-xs">{item.contentPreview}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">
                          {item.target === 'AllUsers' ? 'All Users' : item.target === 'Role' ? `Role: ${item.targetRole}` : 'Specific User'}
                        </div>
                        {item.specificUserName && (
                          <div className="text-xs text-gray-500">{item.specificUserName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-medium">
                          {item.recipientCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">{item.createdByName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetail(item.batchId)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!loading && items.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Send Notification</h2>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setShowConfirm(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={initiateSubmit} className="flex-1 overflow-auto p-6">
              {formError && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                  {formError}
                </div>
              )}

              {showConfirm ? (
                <div className="py-8 text-center">
                  <div className="mb-4">
                    <Bell className="w-12 h-12 text-blue-500 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Sending Notification</h3>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to send this notification to{' '}
                    <span className="font-semibold text-gray-900">
                      {formData.target === 'AllUsers' ? 'all users' : 
                       formData.target === 'Role' ? `all active ${formData.role}s` :
                       selectedUser ? selectedUser.name : 'the selected user'}
                    </span>?
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                    <select
                      required
                      value={formData.target}
                      onChange={e => {
                        setFormData({ ...formData, target: e.target.value, role: null, userId: null });
                        setSelectedUser(null);
                        setUserSearchTerm('');
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {TARGET_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {formData.target === 'Role' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                      <select
                        required
                        value={formData.role || ''}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">-- Choose Role --</option>
                        {ROLE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.target === 'SpecificUser' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search User by Name or Email</label>
                      {selectedUser ? (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-sm">
                          <span className="text-blue-900 font-medium">{selectedUser.name} - {selectedUser.email}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(null);
                              setFormData({ ...formData, userId: null });
                              setUserSearchTerm('');
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={userSearchTerm}
                            onChange={e => setUserSearchTerm(e.target.value)}
                            placeholder="Enter name or email..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          {isSearchingUsers && (
                            <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                          )}
                          {userSearchTerm && userSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                              {userSearchResults.map(u => (
                                <div
                                  key={u.id}
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setFormData({ ...formData, userId: u.id });
                                  }}
                                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                >
                                  <div className="font-medium text-gray-900">{u.name}</div>
                                  <div className="text-gray-500 text-xs">{u.email}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {userSearchError && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-red-50 border border-red-200 rounded-lg shadow-lg z-10 p-3 text-sm text-red-600 flex justify-between items-center">
                              <span>{userSearchError}</span>
                              <button 
                                type="button" 
                                onClick={() => setUserSearchRetryKey(prev => prev + 1)}
                                className="px-2 py-1 bg-red-100 rounded hover:bg-red-200 font-medium"
                              >
                                Retry
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      required
                      maxLength={100}
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter notification title..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      required
                      maxLength={2000}
                      rows={4}
                      value={formData.content}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter notification content..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    if (showConfirm && !submitting) {
                      setShowConfirm(false);
                    } else {
                      setIsCreateModalOpen(false);
                      setShowConfirm(false);
                    }
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showConfirm ? 'Back' : 'Cancel'}
                </button>
                {showConfirm ? (
                  <button
                    type="button"
                    onClick={confirmSubmit}
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                  >
                    {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Sending...' : 'Confirm Send'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Review Notification
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedBatchId && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Notification Details</h2>
              <button 
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto">
              {detailLoading ? (
                <div className="py-12 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                  Loading details...
                </div>
              ) : detailData ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{detailData.title}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {detailData.content}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-gray-500 mb-1">Type</span>
                      <span className="font-medium text-gray-900">{detailData.type}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">Sent Time</span>
                      <span className="font-medium text-gray-900">{new Date(detailData.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">Target</span>
                      <span className="font-medium text-gray-900">
                        {detailData.target === 'AllUsers' ? 'All Users' : detailData.target === 'Role' ? `Role: ${detailData.targetRole}` : 'Specific User'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">Recipient Count</span>
                      <span className="font-medium text-gray-900">{detailData.recipientCount}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">Sent By</span>
                      <span className="font-medium text-gray-900">{detailData.createdByName}</span>
                    </div>
                    {detailData.specificUser && (
                      <div className="col-span-2">
                        <span className="block text-gray-500 mb-1">Recipient Info</span>
                        <span className="font-medium text-gray-900">{detailData.specificUser.fullName} - {detailData.specificUser.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : detailError ? (
                <div className="py-12 text-center">
                  <div className="text-red-500 mb-4">{detailError}</div>
                  <button
                    onClick={() => openDetail(selectedBatchId!)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Failed to load details.
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={closeDetail}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[100] text-white font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
