export type GridListOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  sortDesc?: boolean;
};

export type GridPage = {
  page: number;
  pageSize: number;
  offset: number;
};
