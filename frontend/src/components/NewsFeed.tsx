import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getApiEndpoint } from '@/config/environment'; // Assuming getApiEndpoint can be used for external APIs or you'll create a new one
import { toast } from 'sonner';
import { Newspaper } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: {
    name: string;
  };
  publishedAt: string;
}

interface NewsFeedProps {
  companyDomain: string;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ companyDomain }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        // IMPORTANT: Replace with your actual News API endpoint and key
        // This is a placeholder. You need to set up a backend proxy or use a client-side API key (less secure).
        // Example for NewsAPI.org:
        // const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
        // const NEWS_API_BASE_URL = import.meta.env.VITE_NEWS_API_BASE_URL || 'https://newsapi.org/v2';
        // const query = encodeURIComponent(`"${companyDomain}" OR "CEO of ${companyDomain}"`);
        // const url = `${NEWS_API_BASE_URL}/everything?q=${query}&apiKey=${NEWS_API_KEY}&language=en&sortBy=publishedAt`;

        // For demonstration, we'll use a mock API call.
        // In a real application, you would fetch from a secure backend endpoint
        // that proxies your News API requests to hide your API key.
        
        // Mock API call
        const mockResponse = {
          articles: [
            {
              title: `Latest update from ${companyDomain} on Q3 earnings`,
              description: "The company announced strong Q3 results, exceeding analyst expectations with significant growth in key markets.",
              url: "https://example.com/news/q3-earnings",
              source: { name: "Financial Times" },
              publishedAt: "2023-10-26T10:00:00Z",
            },
            {
              title: `CEO of ${companyDomain} discusses future of AI`,
              description: "In a recent interview, the CEO shared insights on the company's strategic investments in artificial intelligence and machine learning.",
              url: "https://example.com/news/ai-strategy",
              source: { name: "TechCrunch" },
              publishedAt: "2023-10-25T14:30:00Z",
            },
            {
              title: `New partnership announced by ${companyDomain}`,
              description: "A groundbreaking collaboration is set to expand the company's reach into emerging markets.",
              url: "https://example.com/news/partnership",
              source: { name: "Business Wire" },
              publishedAt: "2023-10-24T09:15:00Z",
            },
          ],
        };

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // const response = await fetch(url);
        // if (!response.ok) {
        //   throw new Error(`Failed to fetch news: ${response.statusText}`);
        // }
        // const data = await response.json();
        // setArticles(data.articles.slice(0, 5)); // Limit to 5 articles

        setArticles(mockResponse.articles.slice(0, 5));
        toast.success("News feed updated!");

      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to load news. Please check your API key and network connection.");
        toast.error("Failed to load news feed.");
      } finally {
        setLoading(false);
      }
    };

    if (companyDomain) {
      fetchNews();
    }
  }, [companyDomain]);

  return (
    <Card className="bg-white text-gray-900 shadow-lg rounded-xl"> {/* Changed bg-white to bg-[#e5f2fd] */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-blue" /> Global News
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            Loading news...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-600">
            {error}
          </div>
        ) : articles.length > 0 ? (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-3">
              {articles.map((article, index) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-[#e5f2fd] hover:bg-gray-50 transition-colors" /* Changed bg-gray-100 to bg-white, hover:bg-gray-200 to hover:bg-gray-50 */
                >
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{article.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{article.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {article.source.name} - {new Date(article.publishedAt).toLocaleDateString()}
                  </p>
                </a>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            No news found for {companyDomain}.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsFeed;