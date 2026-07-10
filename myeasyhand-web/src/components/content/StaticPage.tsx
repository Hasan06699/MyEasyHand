import { CONTACT_EMAIL, CONTACT_PHONE } from '@/lib/constants';

export function StaticPage({ title, content }: { title: string; content: string }) {
  const sections = content.trim().split('\n## ').filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      <div className="prose prose-slate mt-8 max-w-none">
        {sections.map((section, i) => {
          const lines = section.split('\n');
          const heading = i === 0 && !section.startsWith('#') ? null : lines[0].replace(/^#+\s*/, '');
          const body = i === 0 && !section.startsWith('##') ? lines : lines.slice(1);

          return (
            <div key={i} className="mb-8">
              {heading && <h2 className="text-xl font-semibold text-slate-900">{heading}</h2>}
              <div className="mt-3 space-y-3 text-slate-600">
                {body.map((line, j) => {
                  if (line.startsWith('- ')) {
                    return (
                      <p key={j} className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        {line.slice(2).replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.trim()) {
                    return <p key={j}>{line.replace(/\*\*/g, '')}</p>;
                  }
                  return null;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-slate-500">
        Questions? Contact us at {CONTACT_EMAIL} or {CONTACT_PHONE}
      </p>
    </div>
  );
}
