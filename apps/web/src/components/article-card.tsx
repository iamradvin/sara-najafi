import Link from "next/link";
import type { Article } from "@/lib/articles";

export function ArticleCard({ article }: Readonly<{ article: Article }>) {
  return (
    <article className="article-card">
      <Link
        aria-label={`خواندن مقاله: ${article.title}`}
        className="article-card-image"
        href={`/articles/${article.slug}`}
        tabIndex={-1}
      >
        <span aria-hidden="true" className="article-placeholder">
          <span className="article-placeholder__mark">SN</span>
          <span className="article-placeholder__copy">
            <small>{article.category}</small>
            <strong>{article.title}</strong>
          </span>
        </span>
      </Link>
      <div className="article-card-content">
        <div className="article-meta">
          <span>{article.category}</span>
          <time>{article.publishedAt}</time>
        </div>
        <h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3>
        <p>{article.excerpt}</p>
        <div className="article-card-footer">
          <span>{article.readTime} مطالعه</span>
          <Link className="text-link" href={`/articles/${article.slug}`}>
            مطالعه مقاله <span aria-hidden="true">←</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
