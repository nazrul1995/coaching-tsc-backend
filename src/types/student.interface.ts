export type Group = "science" | "commerce" | "arts";

export interface TStudent {
  name: string;
  email: string;
  phone: string;
  className: string;
  batch?: string;
  group?: Group;
  photo: string;
}