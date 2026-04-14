import { tutorialSections } from "./data";

export default function TutorialPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Tutorial</h1>
        <p className="text-zinc-500 text-sm mt-1">Guia de uso do painel de LED</p>
      </div>

      <div className="flex gap-8">
        <nav className="hidden lg:block w-48 shrink-0">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Seções
          </p>
          <ul className="flex flex-col gap-1">
            {tutorialSections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors block py-1"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 flex flex-col gap-10">
          {tutorialSections.map((section, index) => (
            <section key={section.id} id={section.id}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {section.title}
                </h2>
              </div>
              <div className="flex flex-col gap-3 pl-10">
                {section.content.map((paragraph, i) => (
                  <p key={i} className="text-sm text-zinc-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
                {section.tip && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Dica</p>
                    <p className="text-sm text-amber-800">{section.tip}</p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
