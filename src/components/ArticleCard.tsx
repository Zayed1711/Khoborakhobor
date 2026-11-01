import Link from "next/link";
import { Article } from "@/types";
import { Clock } from "lucide-react";

interface ArticleCardProps {
  article: Article;
  variant?: "lead" | "standard" | "compact" | "opinion";
}

export default function ArticleCard({ article, variant = "standard" }: ArticleCardProps) {
  const authorName = article.author?.name || "শিক্ষা ও গবেষণা ডেস্ক";
  const authorRole = article.author?.role || "খবরাখবর";
  const authorAvatar =
    article.author?.avatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  if (variant === "lead") {
    return (
      <article className="group flex flex-col md:flex-row gap-6 pb-6 border-b border-[#e2ddd3]">
        <div className="md:w-3/5 overflow-hidden rounded-md bg-[#eee9df] aspect-video relative shadow-2xs">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out brightness-[0.98]"
          />
          <span className="absolute top-3 left-3 bg-[#842323] text-[#ffffff] text-xs font-semibold px-3 py-1 rounded shadow-xs tracking-wide">
            {article.category.name.split(" ")[0]}
          </span>
        </div>
        <div className="md:w-2/5 flex flex-col justify-between">
          <div>
            <Link href={`/article/${article.slug}`}>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191d] group-hover:text-[#842323] transition-colors leading-[1.3] font-serif">
                {article.title}
              </h2>
            </Link>
            <p className="mt-3 text-[#454c59] text-sm sm:text-base line-clamp-3 leading-relaxed font-sans">
              {article.summary}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#ece7dc] flex items-center justify-between text-xs text-[#68707f]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#252a33]">
                {authorName}
              </span>
              <span>•</span>
              <span>{article.publishedAt}</span>
            </div>
            <div className="flex items-center gap-1 text-[#788191]">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readTime}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "opinion") {
    return (
      <article className="p-4 rounded-md bg-[#f6f2e8] border border-[#e2dcd0] hover:border-[#cfc7b7] transition flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-10 h-10 rounded-full object-cover border border-[#d6cfbe] shadow-2xs"
            />
            <div>
              <p className="text-xs font-bold text-[#1c1d21]">
                {authorName}
              </p>
              <p className="text-[11px] text-[#6d7583]">{authorRole}</p>
            </div>
          </div>
          <Link href={`/article/${article.slug}`}>
            <h3 className="text-sm font-semibold text-[#1c1d21] hover:text-[#842323] transition leading-snug font-serif">
              {article.title}
            </h3>
          </Link>
        </div>
        <div className="mt-3 text-xs text-[#707886] flex items-center justify-between pt-2 border-t border-[#e8e2d4]">
          <span>{article.readTime} পাঠ</span>
          <span className="text-[#842323] font-medium hover:underline">কলাম পড়ুন &rarr;</span>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="flex gap-3.5 items-start group py-3 border-b border-[#ece7dc] last:border-0">
        <div className="w-20 h-14 shrink-0 rounded overflow-hidden bg-[#eee9df]">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-[0.98]"
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-semibold text-[#842323] uppercase tracking-wider block">
            {article.category.name.split(" ")[0]}
          </span>
          <Link href={`/article/${article.slug}`}>
            <h4 className="text-xs sm:text-sm font-medium text-[#1c1d21] group-hover:text-[#842323] line-clamp-2 leading-snug">
              {article.title}
            </h4>
          </Link>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#788191]">
            <span>{article.readTime}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col bg-[#ffffff] rounded-md overflow-hidden border border-[#e4ded3] transition hover:border-[#cec6b6] hover:shadow-xs">
      <div className="aspect-video w-full overflow-hidden bg-[#eee9df] relative">
        <img
          src={article.featuredImage}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 brightness-[0.98]"
        />
        <span className="absolute bottom-2 left-2 bg-[#1f2733]/85 text-[#ffffff] text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs">
          {article.category.name.split(" ")[0]}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <Link href={`/article/${article.slug}`}>
            <h3 className="text-base font-bold text-[#1c1d21] group-hover:text-[#842323] transition leading-snug font-serif">
              {article.title}
            </h3>
          </Link>
          <p className="mt-2 text-xs text-[#4e5564] line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        </div>
        <div className="mt-4 pt-2.5 border-t border-[#f0ebdf] flex items-center justify-between text-xs text-[#788191]">
          <span>{authorName}</span>
          <span>{article.readTime}</span>
        </div>
      </div>
    </article>
  );
}
