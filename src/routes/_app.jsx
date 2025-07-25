import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Cloud-IQ - Crayon & HostBill Integration</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
        <style>
          /* Custom styles for enhanced visual appeal */
          .glass-effect {
            backdrop-filter: blur(16px);
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          .gradient-card {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          
          .hover-lift {
            transition: all 0.3s ease;
          }
          
          .hover-lift:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          
          .animate-fade-in {
            animation: fadeIn 0.6s ease-in-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .pulse-subtle {
            animation: pulse-subtle 2s infinite;
          }
          
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
        </style>
      </head>
      <body class="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <Component />
      </body>
    </html>
  );
}