import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '../config/app';
import "./globals.css";

export const metadata = {
  title: `${APP_NAME} - ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
