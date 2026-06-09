import { useState } from "react";

export function usePagination<T>(items: T[], pageSize = 15) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginated = items.slice((page - 1) * pageSize, page * pageSize);

  function goToPage(next: number) {
    setPage(Math.max(1, Math.min(next, totalPages)));
  }

  return { page, setPage: goToPage, totalPages, paginated, total: items.length };
}
