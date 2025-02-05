import { UserProject } from "../../../webui/src/app/types/userproject.js"
import { EPub } from 'epub-gen-memory';
import type { Options, Chapter } from 'epub-gen-memory';

export class EpubCommon {
    public async buildEpub(userContent: UserProject) {
        const options: Options = {
            lang: userContent.lang,
            title: userContent.title,
            author: userContent.author,
            prependChapterTitles: true,
            css: "body { margin-left: .5em; margin-right: .5em; text-align: justify; }\n"
                + "p { font-family: serif; font-size: 10pt; text-align: justify; text-indent: 1em; margin-top: 0px; margin-bottom: 1ex; }\n"
                + "h1, h2 { font-family: sans-serif; font-style: normal; text-align: center; color: black; width: 100%; }\n"
                + "h1, h2 { margin-bottom: 50px; }\n"
                + ".index-title { text-align: center; margin-top: 5em; margin-bottom: 5em; width: 100%; }\n"
                + ".index-content { margin-top: 3em; text-align: justify; width: 100%; }\n"
        };
        const content: Chapter[] = [];
        content.push({
            title: '',
            content: "\t<div class=\"index-title\">"
                + "\t<h1>" + userContent.title + "</h1>\n"
                + "\t<h2>" + userContent.author + "</h2>\n"
                + "\t</div>\n"
                + "\t<div class=\"index-content\">\n<p>"
                + userContent.description
                + "</p>\n\t</div>\n"
                + "\t<div class=\"index-content\">\n"
                + "\t<p>Any copy or distribution without the author's consent is forbidden.</p>\n"
                + "\t<p>© " + (new Date()).getFullYear() + " " + userContent.author + "</p>\n"
                + "\t<h6>Built with Writeepi (https://www.writeepi.com) " + (new Date()).toLocaleString() + "</h6>\n"
                + "\t</div>\n",
            beforeToc: true,
            excludeFromToc: true,
        });
        userContent.content.forEach((c) => {
            if (c !== undefined && c.isBook && !c.isFolder) {
                content.push({ title: c.name, content: c.chapter !== undefined ? c.chapter : '' });
            }
        });
        const epub = new EPub(options, content);
        const buffer = await epub.genEpub();
        return buffer;
    }
}