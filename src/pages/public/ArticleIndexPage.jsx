import { Link } from 'react-router-dom'
import { ARTICLES, articlePath, formatArticleDate } from '../../content/articles'

export default function ArticleIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Artikel</h1>
      <p className="mt-2 max-w-xl text-slate-600">
        Panduan untuk penjual yang membuka pre-order lewat grup WhatsApp, dari cara memulai sampai cara memastikan uangnya benar-benar masuk.
      </p>

      <ul className="mt-8 space-y-4">
        {ARTICLES.map((a) => (
          <li key={a.slug}>
            <Link
              to={articlePath(a.slug)}
              className="block rounded-3xl border border-green-900/10 bg-white p-5 shadow-card transition-colors hover:border-brand-300 sm:p-6"
            >
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{a.title}</h2>
              <p className="mt-2 text-slate-600">{a.description}</p>
              <p className="mt-3 text-sm text-slate-500">
                <time dateTime={a.date}>{formatArticleDate(a.date)}</time> · {a.readingMinutes} menit baca
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
