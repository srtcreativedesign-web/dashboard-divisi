import { Children, isValidElement, useId, useState, type ReactNode } from 'react';

/** Keeps form drafts mounted while switching between related tasks. */
export function ModuleWorkspace({ children }: { children: ReactNode }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState([0]);
  const select = (index: number) => { setActive(index); setVisited(previous => previous.includes(index) ? previous : [...previous, index]); };
  const items = Children.toArray(children);
  const modules = items.filter(item => isValidElement<{ title?: string }>(item) && typeof item.props.title === 'string');
  const other = items.filter(item => !modules.includes(item));

  return (
    <div className="space-y-6">
      {other}
      <div className="flex border-b border-slate-200" role="tablist" aria-label="Pilih tugas">
        {modules.map((item, index) => isValidElement<{ title: string }>(item) && (
          <button
            key={index}
            id={`${id}-tab-${index}`}
            role="tab"
            type="button"
            aria-selected={index === active}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={event => {
              const next = event.key === 'ArrowRight' ? (index + 1) % modules.length : event.key === 'ArrowLeft' ? (index + modules.length - 1) % modules.length : event.key === 'Home' ? 0 : event.key === 'End' ? modules.length - 1 : null;
              if (next !== null) { event.preventDefault(); select(next); document.getElementById(`${id}-tab-${next}`)?.focus(); }
            }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              index === active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-subtle hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {item.props.title}
          </button>
        ))}
      </div>
      <div className="relative">
        {modules.map((item, index) => (
          <div
            key={index}
            id={`${id}-panel-${index}`}
            role="tabpanel"
            aria-labelledby={`${id}-tab-${index}`}
            hidden={index !== active}
            className="animate-in fade-in duration-300 outline-none"
          >
            {visited.includes(index) ? item : null}
          </div>
        ))}
      </div>
    </div>
  );
}
