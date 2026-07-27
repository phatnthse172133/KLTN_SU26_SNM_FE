"use client";

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Eye, EyeOff, Image as ImageIcon, MessageSquare, Search, Star, Store, User } from 'lucide-react';
import { reviewService } from '@/application/features/reviews/reviewService';
import { adminBoothService } from '@/application/features/admin/adminBoothService';
import type { Review } from '@/shared/types';
import { Modal } from './components/Modal';
import { Pagination } from './components/Pagination';
import { resolveMediaUrl } from '@/shared/utils';
import Image from 'next/image';

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  boxShadow: '0 4px 32px rgba(15,23,42,0.06)',
  borderRadius: '1rem',
  overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
  color: '#64748B',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 600,
  textAlign: 'left',
  padding: '0.75rem 1rem',
};

export function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [booths, setBooths] = useState<{ id: string; boothName: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filterRating, setFilterRating] = useState<string>('');
  const [filterVisibility, setFilterVisibility] = useState<string>('');
  const [filterBoothId, setFilterBoothId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filters: { rating?: number; isVisible?: boolean; boothId?: string; keyword?: string } = {};
    if (filterRating) filters.rating = Number(filterRating);
    if (filterVisibility === 'visible') filters.isVisible = true;
    if (filterVisibility === 'hidden') filters.isVisible = false;
    if (filterBoothId) filters.boothId = filterBoothId;
    const reviewFilters = { ...filters, keyword: debouncedSearch || undefined };

    const [reviewResult, boothResult] = await Promise.allSettled([
      reviewService.getAll(currentPage, itemsPerPage, reviewFilters),
      adminBoothService.getAllBooths(1, 100),
    ]);

    if (reviewResult.status === 'fulfilled' && reviewResult.value.success) {
      setReviews(reviewResult.value.data.items);
      setTotalItems(reviewResult.value.data.total);
    } else {
      setReviews([]);
      setTotalItems(0);
      setError('Failed to load reviews. Please try again.');
    }

    if (boothResult.status === 'fulfilled' && boothResult.value.success) {
      const boothList = boothResult.value.data.items;
      setBooths(boothList.map(b => ({ id: b.id, boothName: b.boothName })));
    }

    setLoading(false);
  }, [currentPage, debouncedSearch, filterBoothId, filterRating, filterVisibility]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);


  const toggleVisibility = async (review: Review) => {
    try {
      const response = await reviewService.updateVisibility(review.id, !review.isVisible);
      if (response.success) {
        setReviews(items => items.map(item => item.id === review.id ? response.data : item));
        setSelectedReview(current => current?.id === review.id ? response.data : current);
      }
    } catch {
      setError('The review visibility could not be updated. Please try again.');
    }
  };

  const selectedImageUrl = resolveMediaUrl(selectedReview?.imageUrl);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>Review Management</h2>
        <p style={{ color: '#64748B', marginTop: '0.25rem', fontSize: '0.875rem' }}>Review customer feedback from the API</p>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#DC2626', fontSize: '0.875rem' }}>{error}</span>
          <button
            onClick={() => setReloadKey(k => k + 1)}
            style={{ padding: '0.5rem 1rem', border: '1px solid #DC2626', borderRadius: '0.5rem', background: '#FFFFFF', color: '#DC2626', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={cardStyle}>
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
            <input
              value={searchQuery}
              onChange={event => { setSearchQuery(event.target.value); setCurrentPage(1); }}
              placeholder="Search customer, booth, review..."
              style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.5rem', border: '1px solid #E5E7EB', borderRadius: '0.75rem', outline: 'none', color: '#111827' }}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={filterRating}
              onChange={e => { setFilterRating(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#111827', background: '#FFFFFF', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <select
              value={filterVisibility}
              onChange={e => { setFilterVisibility(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#111827', background: '#FFFFFF', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">All Visibility</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
            <select
              value={filterBoothId}
              onChange={e => { setFilterBoothId(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#111827', background: '#FFFFFF', outline: 'none', cursor: 'pointer', maxWidth: '240px' }}
            >
              <option value="">All Booths</option>
              {booths.map(booth => (
                <option key={booth.id} value={booth.id}>{booth.boothName}</option>
              ))}
            </select>
            {(filterRating || filterVisibility || filterBoothId) && (
              <button
                onClick={() => { setFilterRating(''); setFilterVisibility(''); setFilterBoothId(''); setCurrentPage(1); }}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#64748B', background: '#FFFFFF', cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Booth</th>
                <th style={thStyle}>Rating</th>
                <th style={thStyle}>Review</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>{loading ? 'Loading...' : 'No data available'}</td>
                </tr>
              ) : reviews.map(review => (
                <tr
                  key={review.id}
                  onClick={() => setSelectedReview(review)}
                  style={{ borderBottom: '1px solid #E5E7EB', cursor: 'pointer' }}
                >
                  <td style={{ padding: '0.75rem 1rem', color: '#111827', fontWeight: 600 }}>{review.customerName || 'Not available'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{review.boothName || 'Not available'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#F59E0B', fontWeight: 700 }}>
                      <Star className="w-4 h-4" fill="currentColor" /> {review.rating}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.content || 'No content'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>{new Date(review.createdAt).toLocaleDateString('en-US')}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: review.isVisible ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: review.isVisible ? '#10B981' : '#64748B' }}>
                      {review.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={(event) => { event.stopPropagation(); setSelectedReview(review); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', cursor: 'pointer' }}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button onClick={(event) => { event.stopPropagation(); toggleVisibility(review); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#111827', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', cursor: 'pointer' }}>
                      {review.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {review.isVisible ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && totalItems > 0 && <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} />}
      </div>

      <Modal isOpen={Boolean(selectedReview)} onClose={() => setSelectedReview(null)} title="Review Details" size="lg">
        {selectedReview && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#111827' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '9999px', background: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center' }}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.8125rem' }}>Customer</p>
                    <p style={{ margin: 0, fontWeight: 700 }}>{selectedReview.customerName || 'Not available'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#111827' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '9999px', background: '#ECFDF5', color: '#059669', display: 'grid', placeItems: 'center' }}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.8125rem' }}>Booth</p>
                    <p style={{ margin: 0, fontWeight: 700 }}>{selectedReview.boothName || 'Not available'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.75rem', borderRadius: '9999px', background: '#FFFBEB', color: '#B45309', fontWeight: 700 }}>
                  <Star className="w-4 h-4" fill="currentColor" /> {selectedReview.rating}/5
                </span>
                <span style={{ padding: '0.5rem 0.75rem', borderRadius: '9999px', fontWeight: 700, background: selectedReview.isVisible ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: selectedReview.isVisible ? '#10B981' : '#64748B' }}>
                  {selectedReview.isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#64748B', fontSize: '0.8125rem' }}>
                  <CalendarDays className="w-4 h-4" /> Created
                </p>
                <p style={{ margin: '0.35rem 0 0', color: '#111827', fontWeight: 600 }}>{new Date(selectedReview.createdAt).toLocaleDateString('en-US')}</p>
              </div>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#64748B', fontSize: '0.8125rem' }}>
                  <CalendarDays className="w-4 h-4" /> Updated
                </p>
                <p style={{ margin: '0.35rem 0 0', color: '#111827', fontWeight: 600 }}>{new Date(selectedReview.updatedAt).toLocaleDateString('en-US')}</p>
              </div>
            </div>

            <div style={{ border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#64748B', fontSize: '0.8125rem', fontWeight: 700 }}>
                <MessageSquare className="w-4 h-4" /> Review Content
              </p>
              <p style={{ margin: '0.75rem 0 0', color: '#111827', lineHeight: 1.6 }}>{selectedReview.content || 'No data available'}</p>
            </div>

            <div style={{ border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#64748B', fontSize: '0.8125rem', fontWeight: 700 }}>
                <ImageIcon className="w-4 h-4" /> Review Image
              </p>
              {selectedImageUrl ? (
                <Image
                  src={selectedImageUrl}
                  alt="Review"
                  width={900}
                  height={480}
                  unoptimized
                  style={{ marginTop: '0.75rem', width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: '0.75rem', border: '1px solid #E5E7EB' }}
                />
              ) : (
                <p style={{ margin: '0.75rem 0 0', color: '#64748B' }}>No data available</p>
              )}
            </div>

            <div style={{ border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem', background: selectedReview.reply ? '#F8FAFC' : '#FFFFFF' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#64748B', fontSize: '0.8125rem', fontWeight: 700 }}>
                <MessageSquare className="w-4 h-4" /> Booth Reply
              </p>
              {selectedReview.reply ? (
                <>
                  <p style={{ margin: '0.75rem 0 0', color: '#111827', lineHeight: 1.6 }}>{selectedReview.reply.content || 'No data available'}</p>
                  <p style={{ margin: '0.75rem 0 0', color: '#64748B', fontSize: '0.8125rem' }}>
                    Replied: {new Date(selectedReview.reply.createdAt).toLocaleDateString('en-US')}
                  </p>
                </>
              ) : (
                <p style={{ margin: '0.75rem 0 0', color: '#64748B' }}>No data available</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => toggleVisibility(selectedReview)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#111827', borderRadius: '0.5rem', padding: '0.65rem 1rem', cursor: 'pointer', fontWeight: 700 }}
              >
                {selectedReview.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {selectedReview.isVisible ? 'Hide Review' : 'Show Review'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
