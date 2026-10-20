export interface KnowledgeArticle {
  id: string;
  workflowState: string;
  language: string;
  productCode: string;
  moduleCode: string;
  ownerRef: string;
  createdAt: string;
  versionId: string | null;
  versionNumber: number;
  title: string;
  content: string;
  authorRef: string;
  versionCreatedAt: string | null;
  publishedAt: string | null;
}
