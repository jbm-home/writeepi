import { UuidUtils } from "../../../../server/src/utils/uuidutils.js"
import { UserProject } from "./userproject.js";

export class DefaultProject {
	public static buildDefaultProject(): UserProject {
		return {
			id: UuidUtils.v7(),
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
					{ id: UuidUtils.v7(), orderId: 0, name: "SUMMARY|I18N", icon: "file-check", isFolder: false, expanded: false, context: false, canBeDeleted: false, isSummary: true, isBook: false, words: 0, isTrash: false, isCharacter: false },
					{ id: UuidUtils.v7(), orderId: 1, name: "BOOK|I18N", icon: "book", isFolder: true, expanded: false, context: false, canBeDeleted: false, isBook: true, words: 0, isTrash: false, isCharacter: false, isSummary: false },
					{ id: UuidUtils.v7(), orderId: 2, name: "CHARACTERS|I18N", icon: "file-earmark-person", isFolder: true, isCharacter: true, expanded: false, context: false, canBeDeleted: false, isBook: false, words: 0, isTrash: false, isSummary: false },
					{ id: UuidUtils.v7(), orderId: 3, name: "LOCATIONS|I18N", icon: "map", isFolder: true, expanded: false, context: false, canBeDeleted: false, isBook: false, words: 0, isTrash: false, isCharacter: false, isSummary: false },
					{ id: UuidUtils.v7(), orderId: 4, name: "NOTES|I18N", icon: "journal", isFolder: true, expanded: false, context: false, canBeDeleted: false, isBook: false, words: 0, isTrash: false, isCharacter: false, isSummary: false },
					{ id: UuidUtils.v7(), orderId: 5, name: "TRASH|I18N", icon: "recycle", isFolder: true, expanded: false, context: false, canBeDeleted: false, isTrash: true, isBook: false, words: 0, isCharacter: false, isSummary: false },
				],
			createdAt: (new Date()).toISOString(),
			updatedAt: (new Date()).toISOString(),
			updatedTimestamp: Date.now(),
		};
	}
}