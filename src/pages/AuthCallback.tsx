import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { Video } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let handled = false;

    const redirect = (path: string) => {
      if (handled) return;
      handled = true;
      navigate(path, { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        redirect("/reset-password");
      } else if (event === "SIGNED_IN" && session) {
        redirect("/dashboard");
      }
    });

    const fallback = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirect("/dashboard");
      } else {
        redirect("/signin");
      }
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="relative inline-flex mb-6">
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-40 animate-pulse" />
          <Video className="h-12 w-12 text-white relative z-10" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
        </div>
        <p className="text-white font-semibold text-lg">Signing you in</p>
        <p className="text-gray-400 text-sm mt-1">Please wait a moment...</p>
      </div>
    </div>
  );
}
