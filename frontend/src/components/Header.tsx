"use client";

import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  const handleLogout = () => {
    document.cookie = "dre_token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-gray-800 text-lg">DRE App</span>
        </div>

        {!isLoginPage && (
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
          >
            Sair
          </button>
        )}
      </div>
    </header>
  );
}
