// src/components/Pagination.jsx
import React from 'react';
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  totalItems,
  showInfo = true,
  itemsPerPageOptions = [20, 40, 60],
  onItemsPerPageChange,
  itemsLabel = 'items'
}) => {
  // Tính toán số trang hiển thị (tối đa 5 trang)
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages = [];

    if (totalPages <= maxPagesToShow) {
      // Nếu tổng số trang <= 5, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Nếu tổng số trang > 5, hiển thị thông minh
      if (currentPage <= 3) {
        // Ở đầu: 1, 2, 3, 4, 5, ..., last
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Ở cuối: 1, ..., n-4, n-3, n-2, n-1, n
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Ở giữa: 1, ..., current-1, current, current+1, ..., last
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="border-t border-gray-200 mt-8 pt-4 flex items-center justify-between gap-4">
      {/* Info bên trái */}
      <div className="text-xs sm:text-sm text-gray-600">
        {showInfo && totalItems > 0 && (
          <>
            Showing {startItem}-{endItem} of {totalItems} {itemsLabel}
          </>
        )}
      </div>
      
      {/* Pagination center giống eBay */}
      <div className="flex items-center gap-2 justify-center flex-1">
        {/* Previous Button (tròn) */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || totalPages <= 1}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            currentPage === 1 || totalPages <= 1
              ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
              : 'text-gray-800 bg-gray-100 hover:bg-gray-200'
          }`}
          aria-label="Previous page"
        >
          <AiOutlineLeft size={16} />
        </button>

        {/* First Page (nếu không hiển thị) */}
        {pageNumbers[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-10 h-10 rounded border text-sm font-bold bg-white text-gray-700 border-gray-300 hover:bg-gray-100 transition-colors"
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="text-gray-400 px-2">...</span>
            )}
          </>
        )}

        {/* Page Numbers */}
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-black text-white'
                : 'text-gray-800 hover:bg-gray-100'
            }`}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        {/* Last Page (nếu không hiển thị) */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="text-gray-400 px-2">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button (tròn) */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages <= 1}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            currentPage === totalPages || totalPages <= 1
              ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
              : 'text-gray-800 bg-gray-100 hover:bg-gray-200'
          }`}
          aria-label="Next page"
        >
          <AiOutlineRight size={16} />
        </button>
      </div>

      {/* Items per page giống eBay */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
        <span className="hidden sm:inline">Items Per Page</span>
        <span className="sm:hidden">Per page</span>
        <select
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
        >
          {itemsPerPageOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;

