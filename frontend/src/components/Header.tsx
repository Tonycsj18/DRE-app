"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdmin, getUsername } from "@/lib/api";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [admin, setAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setAdmin(isAdmin());
    setUsername(getUsername());
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = "dre_token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="flex items-center">
            <div className="bg-blue-600 rounded-lg flex items-center justify-center px-2.5 py-1">
              <span className="text-white font-bold text-xs tracking-wide">DRE App</span>
            </div>
          </button>

          {!isLoginPage && (
            <nav className="flex items-center gap-1">
              <button
                onClick={() => router.push("/")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
              >
                Nova DRE
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/dashboard" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
              >
                Dashboard
              </button>
              {admin && (
                <button
                  onClick={() => router.push("/admin")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/admin" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
                >
                  Usuários
                </button>
              )}
            </nav>
          )}
        </div>

        {!isLoginPage && (
          <div className="flex items-center gap-3">
            {username && (
              <span className="text-xs text-gray-400 hidden sm:block">{username}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
