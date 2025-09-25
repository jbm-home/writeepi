export interface UserProjectShort {
  id: string;
  lang: string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProject {
  id: string;
  userId: string;
  lang: string;
  title: string;
  description: string;
  author: string;
  settings: Settings;
  content: Content[];
  createdAt: string;
  updatedAt: string;
  updatedTimestamp?: number;
  wordStats?: WordStats;
}

export interface WordStats {
  daily: Record<string, number>;
}

export type Period = 'day' | 'week' | 'month';

export interface Content {
  id: string;
  orderId: number;
  parentId?: string;
  name: string;
  icon: string;
  isFolder: boolean;
  expanded: boolean;
  context: boolean;
  canBeDeleted: boolean;
  isSummary: boolean;
  isTrash: boolean;
  isBook: boolean;
  isCharacter: boolean;
  chapter?: string;
  notes?: string;
  words: number;
  signs: number;
}

export interface Settings {
  dashConf: boolean;
  quoteConf: boolean;
  spaceConf: boolean;
  apostropheConf: boolean;
  ellipsisConf: boolean;
  backupOnChange: boolean;
  backupInterval: boolean;
  backupAutoDisplayMessage: boolean;
  leftbar?: number;
  rightbar?: number;
  /**
   * Objectives
   */
  objectives: Objectives;
  /**
   * @deprecated Ambiguous variable
   */
  totalWords?: number;
}

export interface Objectives {
  wordsGlobal: number;
  signsGlobal: number;
  wordsChapter: number;
  signsChapter: number;
  chapterObjectiveEnabled: boolean;
  type: ObjectiveType;
}

export enum ObjectiveType {
  words,
  signsIncludingSpaces,
  signsExcludingSpaces,
}
