import type { BillingListOptions } from "@/db/actions/billingListTypes";

type SearchParams = Record<string, string | string[] | undefined>;

export async function getBillingListQuery(
  searchParams: Promise<SearchParams>,
  defaultSort: string,
): Promise<BillingListOptions> {
  const params = await searchParams;
  const parsedPage = Number(getParam(params.page));
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const requestedSort = getParam(params.sort);
  return {
    page,
    search: getParam(params.search),
    sort: requestedSort || defaultSort,
    sortDesc: getParam(params.direction) !== "asc",
  };
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
