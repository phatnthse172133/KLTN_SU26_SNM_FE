import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      style={{ borderTop: '1px solid #E5E7EB' }}
    >
      <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
        Showing{' '}
        <span style={{ color: '#111827', fontWeight: 600 }}>{startItem}-{endItem}</span>
        {' '}of{' '}
        <span style={{ color: '#111827', fontWeight: 600 }}>{totalItems}</span>
      </p>

      <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Pagination">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            color: currentPage === 1 ? '#334155' : '#64748B',
            opacity: currentPage === 1 ? 0.4 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <button
              type="button"
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
              key={`page-${page}`}
              onClick={() => onPageChange(page)}
              className="flex items-center justify-center h-8 rounded-lg text-sm transition-all"
              style={{
                minWidth: '2rem',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem',
                background: currentPage === page
                  ? '#111827'
                  : '#FFFFFF',
                color: currentPage === page ? '#fff' : '#64748B',
                border: currentPage === page ? '1px solid transparent' : '1px solid #E5E7EB',
                boxShadow: currentPage === page ? '0 0 12px rgba(99,102,241,0.35)' : 'none',
                fontWeight: currentPage === page ? 600 : 500,
              }}
            >
              {page}
            </button>
          ) : (
            <span key={`ellipsis-${index}`} style={{ color: '#334155', padding: '0 0.25rem', fontSize: '0.8125rem' }}>
              {page}
            </span>
          )
        )}

        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            color: currentPage === totalPages ? '#334155' : '#64748B',
            opacity: currentPage === totalPages ? 0.4 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
