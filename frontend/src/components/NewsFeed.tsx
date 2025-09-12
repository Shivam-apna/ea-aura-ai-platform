import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Newspaper } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  source_id: string;
  pubDate: string;
}

interface NewsDataResponse {
  status: string;
  totalResults: number;
  results: NewsArticle[];
  nextPage?: string;
}

interface NewsFeedProps {
  companyDomain: string;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ companyDomain }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replace with environment variable in production
  const NEWSDATA_API_KEY = 'pub_f0165722da564a1995195ad5a3a615de';
  const NEWSDATA_BASE_URL = 'https://newsdata.io/api/1/news';

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);

      try {
        // Extract company name from domain for better search results
        const companyName = companyDomain.replace(/\.(com|org|net|io|co).*$/i, '');

        // Build query parameters
        const params = new URLSearchParams({
          apikey: NEWSDATA_API_KEY,
          q: `"${companyDomain}"`,
          language: 'en',
          category: 'business,technology',
          size: '10',
        });

        const url = `${NEWSDATA_BASE_URL}?${params}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: NewsDataResponse = await response.json();
        if (data.status === 'success' && data.results) {
          const validArticles = data.results
            .filter(article => article.title && article.description && article.link)
            .slice(0, 5);
          setArticles(validArticles);
          toast.success(`Found ${validArticles.length} news articles!`);
        } else {
          throw new Error('No articles found or API returned error status');
        }
      } catch (err) {
        console.error("Error fetching news:", err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to load news: ${errorMessage}`);
        toast.error("Failed to load news feed.");

        // Fallback to mock data
        setArticles([
          {
            title: `Latest update from ${companyDomain}`,
            description: "Unable to fetch live news. This is fallback content.",
            link: "https://example.com",
            source_id: "fallback",
            pubDate: new Date().toISOString(),
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (companyDomain && companyDomain.trim()) {
      fetchNews();
    } else {
      setLoading(false);
      setError("Please provide a valid company domain");
    }
  }, [companyDomain]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <Card className="bg-white text-gray-900 shadow-lg rounded-xl border-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-blue-500" /> Trending News
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            Loading news...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-600">
            {error}
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-3">
            {articles.map((article, index) => (
              <a
                key={index}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg bg-[#e5f2fd] hover:bg-gray-200 transition-colors"
              >
                <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                  {article.title}
                </h4>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            No news found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsFeed;
