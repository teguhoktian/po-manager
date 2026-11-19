import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui'
import { ARTICLES, articlePath, formatArticleDate } from '../../content/articles'
import NotFoundPage from './NotFoundPage'

// Whole articles (text included) load only with this page, not with the list or the home page.
const modules = import.meta.glob('../../../content/articles/*.md', { eager: true })
const bySlug = Object.fromEntries(Object.entries(modules).map(([file, mod]) => [file.split('/').pop().replace(/\.md$/, ''), mod]))

export default function ArticlePage() {
  const { slug } = useParams()
  const article = bySlug[slug]
  if (!article) return <NotFoundPage />

  const { meta, html } = article
  const others = ARTICLES.filter((a) => a.slug !== slug).slice(0, 2)

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link to="/artikel" className="text-sm font-semibold text-brand-700 hover:underline">
        Semua artikel
      </Link>
      <h1 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-4xl">{meta.title}</h1>
      <p className="mt-3 text-sm text-slate-500">
        <time dateTime={meta.date}>{formatArticleDate(meta.date)}</time> · {meta.readingMinutes} menit baca
        {meta.updated && (
          <>
            {' '}
            · diperbarui <time dateTime={meta.updated}>{formatArticleDate(meta.updated)}</time>
          </>
        )}
      </p>

      <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: html }} />

      <div className="mt-12 rounded-3xl bg-brand-50 p-6">
        <p className="text-lg font-extrabold text-slate-900">Ingin pre-order tanpa rekap manual?</p>
        <p className="mt-1 text-slate-600">Buat PO, bagikan satu link ke grup, dan biarkan pesanan serta bukti bayar tercatat di satu tempat.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button to="/register">Daftar</Button>
          <Button to="/cara-pakai" variant="secondary">
            Lihat cara pakai
          </Button>
        </div>
      </div>

      {others.length > 0 && (
        <section className="mt-12" aria-labelledby="baca-juga">
          <h2 id="baca-juga" className="text-xl font-extrabold text-slate-900">
            Baca juga
          </h2>
          <ul className="mt-4 space-y-3">
            {others.map((a) => (
              <li key={a.slug}>
                <Link to={articlePath(a.slug)} className="font-semibold text-brand-700 hover:underline">
                  {a.title}
                </Link>
                <p className="text-sm text-slate-600">{a.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
