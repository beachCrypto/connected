export interface Cast {
  hash: string;
  votes: number;
  lastUpdated: string;
  text: string;
  author: {
    display_name: string;
  };
  [key: string]: any;
}