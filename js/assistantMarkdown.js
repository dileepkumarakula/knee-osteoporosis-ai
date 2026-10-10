"use strict";

// Small safe Markdown subset for n8n replies. Nodes are created from text only;
// no returned HTML is ever inserted into the document.
window.renderAssistantMarkdown = function renderAssistantMarkdown(container, source) {
  const inline = (parent, text) => {
    const pattern = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)/g;
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
      parent.append(document.createTextNode(text.slice(cursor, match.index)));
      const el = document.createElement(match[2] || match[3] ? "strong" : match[4] || match[5] ? "em" : "code");
      el.textContent = match[2] || match[3] || match[4] || match[5] || match[6];
      parent.append(el);
      cursor = match.index + match[0].length;
    }
    parent.append(document.createTextNode(text.slice(cursor)));
  };
  container.replaceChildren();
  let list = null;
  String(source || "").split(/\r?\n/).forEach((line) => {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      list = null;
      const element = document.createElement(heading[1].length === 1 ? "h3" : heading[1].length === 2 ? "h4" : "h5");
      inline(element, heading[2]);
      container.append(element);
      return;
    }
    const bullet = /^\s*[-*+]\s+(.+)$/.exec(line);
    if (bullet) {
      if (!list) { list = document.createElement("ul"); container.append(list); }
      const item = document.createElement("li"); inline(item, bullet[1]); list.append(item);
      return;
    }
    list = null;
    if (!line.trim()) return;
    const paragraph = document.createElement("span");
    inline(paragraph, line);
    container.append(paragraph, document.createElement("br"));
  });
};
