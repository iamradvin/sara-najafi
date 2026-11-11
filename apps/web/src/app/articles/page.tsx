import { ArticleCard } from "@/components/article-card";
import { PageLayout } from "@/components/site-shell";
import { articles } from "@/lib/articles";

export const metadata = {
  title: "مجله تخصصی زیبایی مو | سارا نجفی",
  description: "مقاله‌هایی درباره اصول ترکیب رنگ مو، پایه‌های رنگ و دکلره، لایت و بالیاژ و مراقبت از مو.",
};

export default function ArticlesPage() {
  return (
    <PageLayout>
      <section className="container inner-page">
        <div className="page-intro">
          <div className="eyebrow">دانش و نکته‌های کاربردی برای مو</div>
          <h1>مجله تخصصی <span>زیبایی مو</span></h1>
          <p>مطالبی درباره رنگ‌شناسی، دکلره، تکنیک‌های لایت و بالیاژ و مراقبت از موهای رنگ‌شده.</p>
        </div>
        <div className="article-grid">
          {articles.map((article) => <ArticleCard article={article} key={article.slug} />)}
        </div>
      </section>
    </PageLayout>
  );
}
