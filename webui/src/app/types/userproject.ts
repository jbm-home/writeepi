import { uuidv7 } from "../utils/uuidv7";

export class UserProjectTemplate {
	public static DEFAULT_PROJECT: UserProject = {
		id: uuidv7(),
		userId: '',
		lang: "",
		title: "",
		description: "n/a",
		author: "",
		settings: {
			dashConf: true,
			quoteConf: true,
			spaceConf: true,
			backupOnChange: true,
			backupInterval: true,
			backupAutoDisplayMessage: false,
			totalWords: 70000,
		},
		content:
			[
				{ id: uuidv7(), orderId: 0, name: "SUMMARY|I18N", icon: "file-check", isFolder: false, expanded: false, context: false, canBeDeleted: false, isSummary: true, isBook: false, words: 0, isTrash: false, isCharacter: false },
				{ id: uuidv7(), orderId: 1, name: "BOOK|I18N", icon: "book", isFolder: true, expanded: false, context: false, canBeDeleted: false, isBook: true, words: 0, isTrash: false, isCharacter: false, isSummary: false },
				{ id: uuidv7(), orderId: 2, name: "CHARACTERS|I18N", icon: "file-earmark-person", isFolder: true, isCharacter: true, expanded: false, context: false, canBeDeleted: false, isBook: false, words: 0, isTrash: false, isSummary: false },
				{ id: uuidv7(), orderId: 3, name: "LOCATIONS|I18N", icon: "map", isFolder: true, expanded: false, context: false, canBeDeleted: false, isBook: false, words: 0, isTrash: false, isCharacter: false, isSummary: false },
				{ id: uuidv7(), orderId: 4, name: "NOTES|I18N", icon: "journal", isFolder: true, expanded: false, context: false, canBeDeleted: false, isBook: false, words: 0, isTrash: false, isCharacter: false, isSummary: false },
				{ id: uuidv7(), orderId: 5, name: "TRASH|I18N", icon: "recycle", isFolder: true, expanded: false, context: false, canBeDeleted: false, isTrash: true, isBook: false, words: 0, isCharacter: false, isSummary: false },
			],
		createdAt: (new Date()).toISOString(),
		updatedAt: (new Date()).toISOString(),
		updatedTimestamp: Date.now(),
	};
}

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