import Link from "next/link";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/site-shell";
import { articles } from "@/lib/articles";

type ArticleRouteProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  return {
    title: article ? `${article.title} | سارا نجفی` : "مقاله پیدا نشد",
    description: article?.excerpt,
  };
}

export default async function ArticleDetailPage({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();

  return (
    <PageLayout>
      <article className="container inner-page article-page">
        <Link className="back-link" href="/articles">← بازگشت به مقاله‌ها</Link>
        <header className="article-header">
          <div className="eyebrow">{article.category}</div>
          <h1>{article.title}</h1>
          <p>{article.excerpt}</p>
          <div className="article-meta">
            <time>{article.publishedAt}</time>
            <span>{article.readTime} مطالعه</span>
          </div>
        </header>
        <div className="article-cover">
          <div aria-hidden="true" className="article-placeholder">
            <span className="article-placeholder__mark">SN</span>
            <span className="article-placeholder__copy">
              <small>{article.category}</small>
              <strong>{article.title}</strong>
            </span>
          </div>
        </div>
        <div className="article-body">
          <p className="article-introduction">{article.introduction}</p>
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.points && (
                <ul>
                  {section.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              )}
            </section>
          ))}
          <div className="article-related-link">
            <p>اگر دنبال یادگیری ساختارمندتری هستی، دوره‌های منتشرشده را بررسی کن.</p>
            <Link className="button button--outline" href="/courses">بررسی دوره‌ها <span>←</span></Link>
          </div>
        </div>
      </article>
    </PageLayout>
  );
}
