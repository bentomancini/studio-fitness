import type { NextConfig } from "next";

// Evita publicar acidentalmente uma chave administrativa em NEXT_PUBLIC_.
const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (chavePublica) {
  let eChavePublica = chavePublica.startsWith("sb_publishable_");
  if (!eChavePublica) {
    try {
      const payload = JSON.parse(
        Buffer.from(chavePublica.split(".")[1], "base64url").toString("utf8")
      );
      eChavePublica = payload.role === "anon";
    } catch {
      // Chave desconhecida/inválida: não publicá-la no JavaScript do navegador.
    }
  }
  if (!eChavePublica) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY deve ser uma chave pública anon/publishable.");
  }
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
          },
        ],
      },
    ];
  },
  allowedDevOrigins: [
    "192.168.100.52",
    "localhost:3000",
    "26.188.37.74",
    "*.local",
  ],
};

export default nextConfig;
