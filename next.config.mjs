/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "nozpbkulxfcmwrxdfhju.supabase.co"
            },
        ]
    }
};

export default nextConfig;
