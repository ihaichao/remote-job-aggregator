import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface JobDescriptionProps {
  markdown: string;
}

// Renders scraped job descriptions, which are stored as Markdown.
// Raw HTML in the source is not rendered (react-markdown escapes it by default).
export function JobDescription({ markdown }: JobDescriptionProps) {
  return (
    <div className="text-[15px] text-ink/85 leading-7 break-words space-y-3.5 [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h4]:text-[15px] [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h4]:font-semibold [&_h1]:text-ink [&_h2]:text-ink [&_h3]:text-ink [&_h4]:text-ink [&_h1]:pt-3 [&_h2]:pt-3 [&_h3]:pt-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-ink [&_a]:underline [&_a]:decoration-orange [&_a]:decoration-[1.5px] [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-ink [&_li]:marker:text-sep [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_blockquote]:border-l-2 [&_blockquote]:border-orange [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_th]:border [&_td]:border-border [&_th]:border-border [&_td]:px-2 [&_th]:px-2 [&_hr]:border-border">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="nofollow noopener noreferrer" />,
          img: () => null,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
