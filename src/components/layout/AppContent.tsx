'use client';

import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import Header from "./header";
import SearchBar from "../ui/search-bar";
import Footer from "./footer";

export default function AppContent({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative flex min-h-screen flex-col">
            <Header />
            <SearchBar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
              {children}
            </main>
            <Footer />
        </div>
    );
}
