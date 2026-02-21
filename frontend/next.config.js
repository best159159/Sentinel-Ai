/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com', 'localhost'],
        unoptimized: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:5001/api/:path*',
            },
            {
                source: '/uploads/:path*',
                destination: 'http://localhost:5001/uploads/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
