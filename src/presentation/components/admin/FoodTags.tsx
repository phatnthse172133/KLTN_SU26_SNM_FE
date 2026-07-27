"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Tag, BookOpen, Clock, 
  Coffee, Utensils, UtensilsCrossed, Leaf
} from 'lucide-react';
import { Modal } from './components/Modal';
import { Pagination } from './components/Pagination';
import { useToast } from '@/presentation/components/shared/ToastContext';
import { ConfirmDialog } from '@/presentation/components/shared/ConfirmDialog';
import { getErrorMessage } from '@/shared/errors/errorMapper';
import { 
  adminFoodTagService, 
  FoodTag, 
  FoodTagGroup, 
  FoodTagStatus 
} from '@/application/features/admin/adminFoodTagService';

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

export default function FoodTags() {
  const { showToast } = useToast();
  const [tags, setTags] = useState<FoodTag[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedGroup, setSelectedGroup] = useState<FoodTagGroup | 'All'>('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<FoodTag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    tagGroup: FoodTagGroup.Category,
    status: FoodTagStatus.Active
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FoodTag | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);
      const data = await adminFoodTagService.getTags({
        page,
        limit,
        search: debouncedSearch,
        tagGroup: selectedGroup === 'All' ? undefined : selectedGroup
      });
      setTags(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err: unknown) {
      setListError(getErrorMessage(err));
      setTags([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedGroup]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchTags());
  }, [fetchTags]);

  const openModal = (tag?: FoodTag) => {
    setFormError(null);
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        code: tag.code,
        description: tag.description || '',
        tagGroup: tag.tagGroup,
        status: tag.status
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        tagGroup: FoodTagGroup.Category,
        status: FoodTagStatus.Active
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingTag) {
        await adminFoodTagService.updateTag(editingTag.id, {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          tagGroup: formData.tagGroup,
          status: formData.status
        });
      } else {
        await adminFoodTagService.createTag({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          tagGroup: formData.tagGroup,
          status: formData.status
        });
      }
      
      showToast('success', editingTag ? 'The food tag has been updated successfully.' : 'The food tag has been created successfully.');
      setIsModalOpen(false);
      await fetchTags();
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setFormError(message);
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      await adminFoodTagService.deleteTag(deleteTarget.id);
      showToast('success', 'The food tag has been deleted successfully.');
      setDeleteTarget(null);
      await fetchTags();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGroupIcon = (group: FoodTagGroup) => {
    switch (group) {
      case FoodTagGroup.Category: return <BookOpen className="w-4 h-4" />;
      case FoodTagGroup.Cuisine: return <UtensilsCrossed className="w-4 h-4" />;
      case FoodTagGroup.Dietary: return <Leaf className="w-4 h-4" />;
      case FoodTagGroup.Flavor: return <Utensils className="w-4 h-4" />;
      case FoodTagGroup.Ingredient: return <Tag className="w-4 h-4" />;
      case FoodTagGroup.TimeOfDay: return <Clock className="w-4 h-4" />;
      case FoodTagGroup.CookingMethod: return <Coffee className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getGroupName = (group: FoodTagGroup) => {
    return FoodTagGroup[group] || 'Unknown';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Food Tags</h1>
          <p className="text-slate-500 mt-1">Manage semantic tags for AI recommendations</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 hover:shadow flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Tag
        </button>
      </div>

      <div style={cardStyle}>
        {/* Filters */}
        <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tags by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {(['All', FoodTagGroup.Category, FoodTagGroup.Cuisine, FoodTagGroup.Dietary, FoodTagGroup.Flavor, FoodTagGroup.Ingredient, FoodTagGroup.TimeOfDay, FoodTagGroup.CookingMethod] as const).map(tab => (
              <button
                type="button"
                key={tab}
                onClick={() => { setSelectedGroup(tab); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedGroup === tab 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'All' ? 'All Tags' : getGroupName(tab as FoodTagGroup)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Tag Info</th>
                <th style={thStyle}>Code</th>
                <th style={thStyle}>Group</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle} className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 mt-2 text-sm">Loading tags...</p>
                  </td>
                </tr>
              ) : listError ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <p className="text-sm font-medium text-red-700">{listError}</p>
                    <button type="button" onClick={() => void fetchTags()} className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Retry</button>
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No tags found matching your criteria.
                  </td>
                </tr>
              ) : (
                tags.map(tag => (
                  <tr key={tag.id} className="hover:bg-slate-50 transition-colors">
                    <td style={tdStyle}>
                      <div>
                        <p className="font-semibold text-slate-900">{tag.name}</p>
                        {tag.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{tag.description}</p>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-xs font-medium rounded-md border border-slate-200">
                        {tag.code}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                          {getGroupIcon(tag.tagGroup)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {getGroupName(tag.tagGroup)}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${tag.status === FoodTagStatus.Active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          tag.status === FoodTagStatus.Draft ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'}
                      `}>
                        {FoodTagStatus[tag.status] || 'Unknown'}
                      </span>
                    </td>
                    <td style={tdStyle} className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          type="button"
                          onClick={() => openModal(tag)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Tag"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeleteTarget(tag)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Tag"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="bg-white">
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingTag ? 'Edit Food Tag' : 'Create New Food Tag'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg">
              {formError}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. Spicy, Vegan, Vietnamese..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
            <input
              type="text"
              required
              disabled={!!editingTag}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
              className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${editingTag ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              placeholder="e.g. SPICY, VEGAN..."
            />
            {!editingTag && <p className="text-xs text-slate-500 mt-1">Unique identifier, uppercase, no spaces.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Group *</label>
            <select
              required
              value={formData.tagGroup}
              onChange={(e) => setFormData({ ...formData, tagGroup: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value={FoodTagGroup.Category}>Category</option>
              <option value={FoodTagGroup.Cuisine}>Cuisine</option>
              <option value={FoodTagGroup.Dietary}>Dietary</option>
              <option value={FoodTagGroup.Flavor}>Flavor</option>
              <option value={FoodTagGroup.Ingredient}>Ingredient</option>
              <option value={FoodTagGroup.TimeOfDay}>Time Of Day</option>
              <option value={FoodTagGroup.CookingMethod}>Cooking Method</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value={FoodTagStatus.Active}>Active</option>
              <option value={FoodTagStatus.Draft}>Draft</option>
              <option value={FoodTagStatus.Inactive}>Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Short description for AI understanding..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Saving...' : 'Save Tag'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Food Tag"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={isSubmitting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
