import { useState } from "react";

export function usePagination<T>(items: T[], pageSize = 15) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  function goToPage(next: number) {
    setPage(Math.max(1, Math.min(next, totalPages)));
  }

  return { page: safePage, setPage: goToPage, totalPages, paginated };
}
