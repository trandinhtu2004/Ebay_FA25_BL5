// src/components/Pagination.jsx
import React from 'react';
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  totalItems,
  showInfo = true 
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

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      {showInfo && (
        <div className="text-sm text-gray-600">
          Showing {startItem}-{endItem} of {totalItems} orders
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded border transition-colors ${
            currentPage === 1
              ? 'text-gray-300 border-gray-200 cursor-not-allowed'
              : 'text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
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
            className={`w-10 h-10 rounded border text-sm font-bold transition-colors ${
              currentPage === page
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
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
              className="w-10 h-10 rounded border text-sm font-bold bg-white text-gray-700 border-gray-300 hover:bg-gray-100 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded border transition-colors ${
            currentPage === totalPages
              ? 'text-gray-300 border-gray-200 cursor-not-allowed'
              : 'text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
          }`}
          aria-label="Next page"
        >
          <AiOutlineRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

