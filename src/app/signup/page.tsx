
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
    <svg role="img" viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.88 1.62-4.59 0-8.31-3.79-8.31-8.42s3.72-8.42 8.31-8.42c2.47 0 4.14.95 5.25 2.02l2.6-2.6C18.99 1.49 16.25 0 12.48 0 5.65 0 .24 5.51.24 12.42s5.41 12.42 12.24 12.42c3.23 0 5.96-1.09 7.95-3.11 2.09-2.09 2.7-5.11 2.7-7.73v-2.1H12.48z"/></svg>
);
const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props} fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.032 17.834a4.382 4.382 0 01-1.583.292c-.416 0-.96-.094-1.603-.309-.643-.215-1.375-.5-2.125-.855-1.071-.508-2.02-.99-2.792-1.428-.825-.467-1.47-1.03-1.926-1.691-.456-.66-.692-1.455-.692-2.378 0-1.12.35-2.088.99-2.902.64-.814 1.508-1.221 2.604-1.221.758 0 1.559.26 2.342.758.783.498 1.455.772 1.987.772.532 0 1.22-.274 2.02-.772.8-.515 1.623-.74 2.438-.74.417 0 .937.108 1.542.323.604.215 1.146.498 1.604.855.375.309.687.643.917.99.23.348.344.69.344,1.021a1.21 1.21 0 00-.312.868c0 .416-.146.8-.438 1.156-.292.356-.687.68-1.167.973-.48.291-.98.515-1.48.66-.5.145-1.012.215-1.523.215-.55 0-1.18-.16-1.875-.485-.695-.323-1.334-.485-1.917-.485-.584 0-1.146.162-1.667.485-.52.323-1.041.813-1.542 1.448a5.132 5.132 0 00-.583 1.083c.73-.02 1.448-.182 2.125-.485.677-.308 1.341-.616 1.98-.916.333-.163.654-.244.96-.244a.82.82 0 01.695.291c.215.292.322.61.322.959a.9.9 0 01-.195.632 1.4 1.4 0 01-.52.485c-.215.146-.437.27-.667.375-.23.105-.48.192-.75.263-.27.07-.515.105-.73.105zM15.42 2.216c.334.814.501 1.7.501 2.646 0 1.02-.215 1.956-.632 2.792-.417.836-1.02 1.497-1.792 1.987-.77.49-1.56.74-2.342.74s-1.56-.25-2.32-.74c-.76-.49-1.35-1.151-1.75-1.987-.4-8.836-.6-1.772-.6-2.792 0-.946.175-1.834.52-2.646C7.32.88 8.165.216 9.352.216c.417 0 .842.112 1.25.334.408.222.8.52 1.166.88.367-.36.758-.658 1.167-.88.408-.222.825-.334 1.233-.334.417 0 .817.07 1.184.215.366.145.7.354.98.625z"/></svg>
);
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props} fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" /></svg>
);
const MicrosoftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props} fill="currentColor"><path d="M11.4 21.9H2.1V12.6h9.3v9.3zm0-11.4H2.1V2.1h9.3v9.4zm10.5 11.4h-9.3V12.6h9.3v9.3zm0-11.4h-9.3V2.1h9.3v9.4z" /></svg>
);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props} fill="currentColor"><path d="m18.9 1.15l-4.97 4.97L9.93 1.15H1.15l8.78 12.83L1.15 22.85h8.78l5.05-5.05 4.9 5.05h8.78L15.2 9.17l8.7-8.02h-8.78ZM10.53 2.15h2.1l8.1 19.7h-2.1L10.53 2.15Z" /></svg>
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Oppure continua con
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
             <Button variant="outline" className="w-full" onClick={() => handleSocialLogin('google')} disabled={isLoading}>
                {socialLoading === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5" />}
                Continua con Google
            </Button>
             <Button variant="outline" className="w-full" onClick={() => handleSocialLogin('apple')} disabled={isLoading}>
                {socialLoading === 'apple' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AppleIcon className="mr-2 h-5 w-5" />}
                Continua con Apple
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleSocialLogin('facebook')} disabled={isLoading}>
                {socialLoading === 'facebook' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FacebookIcon className="mr-2 h-5 w-5" />}
                Continua con Meta
            </Button>
             <Button variant="outline" className="w-full" onClick={() => handleSocialLogin('microsoft')} disabled={isLoading}>
                {socialLoading === 'microsoft' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MicrosoftIcon className="mr-2 h-5 w-5" />}
                Continua con Microsoft
            </Button>
             <Button variant="outline" className="w-full" onClick={() => handleSocialLogin('twitter')} disabled={isLoading}>
                {socialLoading === 'twitter' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XIcon className="mr-2 h-5 w-5" />}
                Continua con X
            </Button>
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
