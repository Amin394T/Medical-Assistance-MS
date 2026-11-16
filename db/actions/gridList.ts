import type { GridListOptions, GridPage } from "./gridListTypes";

export const DEFAULT_GRID_PAGE_SIZE = 25;
const MAX_GRID_PAGE_SIZE = 100;

export function getGridPage(totalCount: number, options: Pick<GridListOptions, "page" | "pageSize"> = {}): GridPage {
  const requestedPageSize = options.pageSize;
  const pageSize = typeof requestedPageSize === "number" &&
    Number.isSafeInteger(requestedPageSize) &&
    requestedPageSize > 0
    ? Math.min(requestedPageSize, MAX_GRID_PAGE_SIZE)
    : DEFAULT_GRID_PAGE_SIZE;
  const requestedPage = typeof options.page === "number" &&
    Number.isSafeInteger(options.page) &&
    options.page > 0
    ? options.page
    : 1;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(requestedPage, pageCount);
  return { page, pageSize, offset: (page - 1) * pageSize };
}
