const https = require('https');
const { analyzeNewsArticle } = require('./aiService');
const NewsRisk = require('../models/NewsRisk');

const NEWS_KEYWORDS = ['flood', 'earthquake', 'wildfire', 'storm', 'disaster', 'hurricane', 'tornado', 'tsunami'];

/**
 * Fetch disaster news from NewsAPI and analyze with AI
 */
async function fetchAndAnalyzeNews() {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ NEWS_API_KEY not set, skipping news fetch');
        return [];
    }

    const query = NEWS_KEYWORDS.join(' OR ');
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${apiKey}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', async () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.status !== 'ok' || !parsed.articles) {
                        console.error('NewsAPI error:', parsed.message || 'No articles');
                        resolve([]);
                        return;
                    }

                    const results = [];

                    // Process top 10 articles
                    for (const article of parsed.articles.slice(0, 10)) {
                        try {
                            const analysis = await analyzeNewsArticle(
                                article.title || '',
                                article.description || ''
                            );

                            // Save each province as a separate risk entry
                            const provinces = analysis.affectedProvinces || ['Unknown'];
                            for (const province of provinces) {
                                const newsRisk = await NewsRisk.create({
                                    province,
                                    riskScore: analysis.riskScore || 50,
                                    summary: analysis.summary || article.description || '',
                                    riskLevel: analysis.riskLevel || 'Medium',
                                    source: {
                                        title: article.title,
                                        url: article.url,
                                        publishedAt: article.publishedAt,
                                    },
                                });
                                results.push(newsRisk);
                            }
                        } catch (err) {
                            console.error('Error processing article:', err.message);
                        }
                    }

                    resolve(results);
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

/**
 * Get cached news risks (last 24 hours)
 */
async function getCachedNewsRisks() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return NewsRisk.find({ createdAt: { $gte: twentyFourHoursAgo } })
        .sort({ riskScore: -1 })
        .limit(50);
}

module.exports = { fetchAndAnalyzeNews, getCachedNewsRisks };
