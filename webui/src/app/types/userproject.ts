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
}

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
}

export interface Settings {
	dashConf: boolean;
	quoteConf: boolean;
	spaceConf: boolean;
	backupOnChange: boolean;
	backupInterval: boolean;
	backupAutoDisplayMessage: boolean;
	totalWords: number;
}