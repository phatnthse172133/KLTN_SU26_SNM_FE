import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  compact?: boolean;
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  compact = false,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageButtons = (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 transition-colors ${
          currentPage === 1
            ? "text-gray-300 cursor-not-allowed bg-gray-50"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={page === "..."}
          className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
            page === currentPage
              ? "bg-indigo-600 text-white shadow-sm"
              : page === "..."
              ? "text-gray-400 cursor-default"
              : "text-gray-700 hover:bg-gray-50 border border-gray-300"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className={`w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 transition-colors ${
          currentPage === totalPages || totalPages === 0
            ? "text-gray-300 cursor-not-allowed bg-gray-50"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-2 px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border border-indigo-500 rounded-md px-2 py-1 bg-white text-gray-900 font-medium outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200 cursor-pointer text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>rows</span>
          </div>
          <span className="text-sm text-gray-600">
            {startItem}–{endItem} of {totalItems}
          </span>
        </div>
        <div className="flex justify-center">{pageButtons}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border-2 border-indigo-500 rounded-lg px-3 py-1.5 bg-white text-gray-900 font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>rows</span>
        </div>
        <span className="text-sm text-gray-700 font-medium">
          {startItem}–{endItem} of {totalItems} rows
        </span>
      </div>

      <div className="flex items-center gap-1">{pageButtons}</div>
    </div>
  );
}
