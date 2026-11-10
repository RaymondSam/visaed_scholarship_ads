import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

export function Markdown({ source }: { source: string }) {
  if (!source.trim()) return null;
  return (
    <div className="rich-text">
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children }) => (
            <a href={href} rel="noopener noreferrer" target="_blank">
              {children}
            </a>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
