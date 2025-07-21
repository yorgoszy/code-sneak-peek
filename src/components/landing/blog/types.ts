
export interface Article {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  content: string;
  bibliography?: string;
}

export interface BlogSectionProps {
  translations: any;
}
