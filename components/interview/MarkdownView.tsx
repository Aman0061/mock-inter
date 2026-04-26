import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose-invert max-w-none text-sm leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h1 className="mt-6 mb-3 text-xl font-semibold" {...props} />
          ),
          h2: (props) => (
            <h2
              className="mt-6 mb-3 text-base font-semibold uppercase tracking-wide text-muted-foreground"
              {...props}
            />
          ),
          h3: (props) => (
            <h3 className="mt-4 mb-2 text-sm font-semibold" {...props} />
          ),
          p: (props) => <p className="my-3 leading-relaxed" {...props} />,
          ul: (props) => (
            <ul className="my-3 list-disc space-y-1.5 pl-5" {...props} />
          ),
          ol: (props) => (
            <ol className="my-3 list-decimal space-y-1.5 pl-5" {...props} />
          ),
          li: (props) => <li className="leading-relaxed" {...props} />,
          strong: (props) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),
          em: (props) => <em className="italic text-foreground" {...props} />,
          a: (props) => (
            <a
              className="text-primary underline underline-offset-2 hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          code: (props) => (
            <code
              className="rounded bg-white/10 px-1.5 py-0.5 text-xs"
              {...props}
            />
          ),
          table: (props) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-xs" {...props} />
            </div>
          ),
          th: (props) => (
            <th
              className="border border-white/10 px-3 py-2 text-left font-semibold"
              {...props}
            />
          ),
          td: (props) => (
            <td className="border border-white/10 px-3 py-2 align-top" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
