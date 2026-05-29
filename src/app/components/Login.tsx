import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import comproDlsLogo from "../../assets/icons/ComproDLSLogo.svg";

export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("manav.manocha@comprotechnologies.com");
  const [password, setPassword] = useState("Compro11");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/");
      } else {
        setError(
          "Invalid email or password. Try: manav.manocha@comprotechnologies.com or sneha.goel@comprotechnologies.com with password Compro11",
        );
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f4f4f4] px-4 py-4 flex items-center justify-center">
      <div className="w-full max-w-[470px] rounded-lg border border-[#d3d7de] bg-[#f6f7f9] p-6 sm:p-8">
          <div className="mx-auto mb-5 flex flex-col items-center justify-center gap-2">
          <img
            src={comproDlsLogo}
            alt="comproDLS"
            className="h-7 w-auto"
          />
          <span className="text-2xl font-bold text-[#5f7590]">BUILDER</span>
        </div>

        <h1 className="mb-4 text-center text-3xl font-normal leading-none text-[#0f172a]">
          Sign In
        </h1>

        <form onSubmit={handleLogin} className="space-y-4 px-1 sm:px-2">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <Label
              htmlFor="email"
              className="mb-1 block text-base font-semibold leading-tight text-[#5e7189]"
            >
              With Username or Email
            </Label>
            <Label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-[#8a9099]"
            >
              Username Or Email
            </Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 rounded-md border-[#c7d0dc] bg-[#dbe3f0] px-4 text-base text-[#222] focus-visible:ring-1 focus-visible:ring-[#5f88d1]"
              required
            />
          </div>

          <div>
            <Label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-[#8a9099]"
            >
              Password*
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="h-11 rounded-md border-[#c7d0dc] bg-[#dbe3f0] px-4 pr-12 text-base text-[#222] focus-visible:ring-1 focus-visible:ring-[#5f88d1]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7c8ca2] transition-colors hover:text-[#50657f]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-1 text-left">
            <button
              type="button"
              className="text-sm font-semibold text-[#2f65d8] hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-10 w-full rounded-lg bg-[#2f66dd] text-base font-semibold tracking-[0.01em] text-white shadow-[0_8px_18px_rgba(40,85,175,0.24)] hover:bg-[#2a5cc7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "LOGIN"}
          </Button>

          <div className="pt-2 text-center">
            <button
              type="button"
              className="text-sm font-semibold text-[#2f65d8] hover:underline"
            >
              Don't have an account?
            </button>
          </div>
        </form>
      </div>

      <div className="pointer-events-none fixed bottom-3 right-5 flex items-end gap-2 text-[#444]">
        <span className="text-base">powered by</span>
        <img
          src={comproDlsLogo}
          alt="comproDLS"
          className="h-8 w-auto"
        />
      </div>
    </div>
  );
}