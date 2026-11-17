import { Link } from 'react-router-dom'
import { COMPANY, LEGAL_UPDATED, SITE } from '../../../config/site'

/** Renders a legal text: sections of paragraphs, each paragraph a string or { list: [...] }. */
export function LegalDocument({ title, intro, sections }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Terakhir diperbarui: {LEGAL_UPDATED}</p>
      {intro && <p className="mt-6 text-slate-700">{intro}</p>}

      <nav aria-label="Daftar isi" className="mt-8 rounded-2xl border border-green-900/10 bg-white p-4 text-sm shadow-card">
        <p className="mb-2 font-bold text-slate-900">Isi dokumen</p>
        <ol className="columns-1 gap-6 sm:columns-2">
          {sections.map((s, i) => (
            <li key={s.title} className="break-inside-avoid py-0.5">
              <a href={`#pasal-${i + 1}`} className="text-brand-700 hover:underline">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-8">
        {sections.map((s, i) => (
          <section key={s.title} id={`pasal-${i + 1}`} className="scroll-mt-24">
            <h2 className="text-lg font-bold text-slate-900">
              {i + 1}. {s.title}
            </h2>
            <div className="mt-2 space-y-3 text-slate-700">
              {s.body.map((p, j) =>
                typeof p === 'string' ? (
                  <p key={j}>{p}</p>
                ) : (
                  <ol key={j} className="list-[lower-alpha] space-y-1.5 pl-6">
                    {p.list.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ol>
                ),
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-brand-50 p-5 text-sm text-slate-700">
        <p className="font-bold text-slate-900">{COMPANY.name}</p>
        <p>{COMPANY.address}</p>
        <p>
          WhatsApp {COMPANY.whatsappDisplay} · Email {COMPANY.email}
        </p>
        <p className="mt-3">
          <Link to="/syarat-ketentuan" className="font-semibold text-brand-700 hover:underline">
            Syarat &amp; Ketentuan
          </Link>
          {' · '}
          <Link to="/kebijakan-privasi" className="font-semibold text-brand-700 hover:underline">
            Kebijakan Privasi
          </Link>
          {' · '}
          <Link to="/kontak" className="font-semibold text-brand-700 hover:underline">
            Kontak
          </Link>
        </p>
        <p className="mt-2 text-xs text-slate-500">{SITE.name} ({SITE.domain}) dioperasikan oleh {COMPANY.name}.</p>
      </div>
    </div>
  )
}
