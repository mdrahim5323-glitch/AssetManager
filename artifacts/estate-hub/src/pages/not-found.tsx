import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0d14]">
      <Card className="w-full max-w-md mx-4 bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
            <h1 className="text-xl font-bold text-slate-100">Page not found</h1>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            The page you're looking for doesn't exist.
          </p>
          <Link href="/dashboard">
            <span className="text-sm text-blue-400 hover:text-blue-300 underline cursor-pointer">
              Go to Dashboard →
            </span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
