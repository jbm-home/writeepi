import Quill from 'quill';

const Inline = Quill.import('blots/inline') as any;

class SearchedStringBlot extends Inline {}

SearchedStringBlot['blotName'] = 'SearchedString';
SearchedStringBlot['className'] = 'ql-searched-string';
SearchedStringBlot['tagName'] = 'div';

export default SearchedStringBlot;
