
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const signupSchema = z
  .object({
    email: z.string().email({ message: "Indirizzo email non valido." }),
    password: z
      .string()
      .min(6, { message: "La password deve contenere almeno 6 caratteri." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non corrispondono.",
    path: ["confirmPassword"],
  });

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="526 128 768 768" {...props}>
        <path d="M1286.32 520.727C1286.32 493.498 1283.88 467.316 1279.34 442.182H917.68V590.895H1124.34C1115.27 638.72 1088.04 679.215 1047.19 706.444V803.142H1171.82C1244.43 736.116 1286.32 637.673 1286.32 520.727Z" fill="#4285F4"/>
        <path d="M917.68 896C1021.36 896 1108.28 861.789 1171.82 803.142L1047.19 706.444C1012.98 729.484 969.346 743.447 917.68 743.447C817.84 743.447 733.011 676.073 702.64 585.309H574.873V684.451C638.058 809.775 767.571 896 917.68 896Z" fill="#34A853"/>
        <path d="M702.64 584.96C694.96 561.92 690.422 537.484 690.422 512C690.422 486.516 694.96 462.08 702.64 439.04V339.898H574.873C548.691 391.564 533.68 449.862 533.68 512C533.68 574.138 548.691 632.436 574.873 684.102L674.364 606.604L702.64 584.96Z" fill="#FBBC05"/>
        <path d="M917.68 280.902C974.233 280.902 1024.5 300.451 1064.65 338.153L1174.61 228.189C1107.93 166.051 1021.36 128 917.68 128C767.571 128 638.058 214.225 574.873 339.898L702.64 439.04C733.011 348.276 817.84 280.902 917.68 280.902Z" fill="#EA4335"/>
    </svg>
);
const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 814 1000" {...props} fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>
);
const MetaIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 90 90" fill="currentColor" {...props} xmlns="http://www.w3.org/2000/svg">
        <path d="M 69.829 32.38 c -3.21 -4.786 -7.404 -7.337 -11.808 -7.337 c -2.623 0 -5.229 1.17 -7.645 3.277 c -1.635 1.426 -3.143 3.235 -4.552 5.138 c -1.733 -2.194 -3.347 -3.878 -4.909 -5.153 c -2.961 -2.418 -5.797 -3.262 -8.65 -3.262 c -4.926 0 -9.22 3.208 -12.196 7.795 c -3.354 5.172 -5.118 11.87 -5.118 18.297 c 0 3.534 0.698 6.635 2.119 8.999 c 1.741 2.901 4.552 4.826 8.997 4.826 c 3.747 0 6.593 -1.682 9.927 -6.121 c 1.902 -2.535 2.865 -4.071 6.669 -10.815 l 1.893 -3.354 c 0.158 -0.281 0.308 -0.543 0.463 -0.818 c 0.154 0.252 0.305 0.494 0.46 0.753 l 5.39 9.003 c 1.812 3.03 4.167 6.401 6.182 8.299 c 2.621 2.472 4.991 3.053 7.666 3.053 c 4.303 0 6.861 -2.272 8.173 -4.545 c 1.358 -2.351 2.157 -5.327 2.157 -9.377 C 75.048 44.223 73.342 37.621 69.829 32.38 z M 39.397 43.065 c -1.896 2.911 -4.713 7.555 -7.103 10.863 c -2.984 4.127 -4.533 4.548 -6.226 4.548 c -1.312 0 -2.6 -0.591 -3.463 -1.988 c -0.658 -1.066 -1.162 -2.828 -1.162 -5.122 c 0 -5.563 1.578 -11.356 4.155 -15.245 c 1.822 -2.752 4 -4.552 6.564 -4.552 c 3.168 0 5.154 1.981 6.698 3.622 c 0.77 0.818 1.846 2.18 3.09 3.952 L 39.397 43.065 z M 64.718 58.475 c -1.453 0 -2.571 -0.577 -4.167 -2.512 c -1.241 -1.507 -3.363 -4.702 -7.091 -10.913 l -1.544 -2.575 c -1.1 -1.832 -2.143 -3.475 -3.142 -4.958 c 0.176 -0.272 0.353 -0.559 0.527 -0.818 c 2.807 -4.174 5.304 -6.514 8.407 -6.514 c 2.869 0 5.477 1.898 7.49 5.003 c 2.836 4.378 4.123 10.506 4.123 16.027 C 69.322 55.09 68.402 58.475 64.718 58.475 z" />
    </svg>
);
const MicrosoftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 23 23" {...props} xmlns="http://www.w3.org/2000/svg">
        <path fill="#f35325" d="M1 1h10v10H1z"/>
        <path fill="#81bc06" d="M12 1h10v10H12z"/>
        <path fill="#05a6f0" d="M1 12h10v10H1z"/>
        <path fill="#ffba08" d="M12 12h10v10H12z"/>
    </svg>
);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 396 396" {...props} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M301.026 37.125H355.608L236.362 173.415L376.645 358.875H266.805L180.774 246.394L82.335 358.875H27.72L155.265 213.097L20.691 37.125H133.32L211.084 139.936L301.026 37.125ZM281.869 326.205H312.114L116.886 68.079H84.4305L281.869 326.205Z"/>
    </svg>
);

type SocialProvider = 'google' | 'facebook' | 'apple' | 'microsoft' | 'twitter';

export default function SignupPage() {
  const { signup, loginWithGoogle, loginWithFacebook, loginWithApple, loginWithMicrosoft, loginWithTwitter } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setLoading(true);
    try {
      await signup(values.email, values.password);
      toast({
        title: "Account Creato",
        description: "Benvenuto in BudgetWise! Hai effettuato l'accesso.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registrazione Fallita",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    setSocialLoading(provider);
    try {
        switch (provider) {
            case 'google': await loginWithGoogle(); break;
            case 'facebook': await loginWithFacebook(); break;
            case 'apple': await loginWithApple(); break;
            case 'microsoft': await loginWithMicrosoft(); break;
            case 'twitter': await loginWithTwitter(); break;
        }
        toast({ title: "Successo", description: "Registrazione completata e accesso effettuato." });
        router.push("/dashboard");
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Registrazione Fallita",
            description: "Impossibile completare la registrazione con questo provider. Riprova.",
        });
    } finally {
        setSocialLoading(null);
    }
  }

  const isLoading = loading || !!socialLoading;


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <Wallet className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Crea un Account</CardTitle>
          <CardDescription>
            Unisciti a BudgetWise e prendi il controllo delle tue finanze.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@esempio.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conferma Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {loading ? "Creazione account in corso..." : "Registrati"}
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Oppure continua con
              </span>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 py-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-full transition-opacity hover:opacity-80 hover:bg-background" onClick={() => handleSocialLogin('google')} disabled={isLoading}>
                  {socialLoading === 'google' ? <Loader2 className="h-6 w-6 animate-spin" /> : <GoogleIcon className="h-7 w-7" />}
                  <span className="sr-only">Continua con Google</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Continua con Google</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" className="h-12 w-12 rounded-full bg-black text-white transition-opacity hover:opacity-80" onClick={() => handleSocialLogin('apple')} disabled={isLoading}>
                  {socialLoading === 'apple' ? <Loader2 className="h-6 w-6 animate-spin" /> : <AppleIcon className="h-7 w-7" />}
                  <span className="sr-only">Continua con Apple</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Continua con Apple</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" className="h-12 w-12 rounded-full bg-[#1877F2] text-white transition-opacity hover:opacity-80" onClick={() => handleSocialLogin('facebook')} disabled={isLoading}>
                  {socialLoading === 'facebook' ? <Loader2 className="h-6 w-6 animate-spin" /> : <MetaIcon className="h-8 w-8" />}
                  <span className="sr-only">Continua con Meta</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Continua con Meta</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-full transition-opacity hover:opacity-80 hover:bg-background" onClick={() => handleSocialLogin('microsoft')} disabled={isLoading}>
                  {socialLoading === 'microsoft' ? <Loader2 className="h-6 w-6 animate-spin" /> : <MicrosoftIcon className="h-7 w-7" />}
                  <span className="sr-only">Continua con Microsoft</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Continua con Microsoft</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" className="h-12 w-12 rounded-full bg-black text-white transition-opacity hover:opacity-80" onClick={() => handleSocialLogin('twitter')} disabled={isLoading}>
                  {socialLoading === 'twitter' ? <Loader2 className="h-6 w-6 animate-spin" /> : <XIcon className="h-6 w-6" />}
                  <span className="sr-only">Continua con X</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Continua con X</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <p className="mt-6 text-center text-sm">
            Hai già un account?{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Accedi
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
