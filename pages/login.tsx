
// pages/login.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña no puede estar vacía.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { setCurrentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    form.control._formState.isSubmitting = true;
    try {
      const response = await fetch('https://back.presupuesto.peryloth.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.access_token) {
        setCurrentUser({ email: data.email }); // Backend doesn't return full user details on login
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', responseData.access_token);
        }
        toast({
          title: 'Inicio de Sesión Exitoso',
          description: `Bienvenido de nuevo, ${data.email}`,
        });
        router.push('/');
      } else {
        toast({
          title: 'Error de Inicio de Sesión',
          description: responseData.message || responseData.error || `Error ${response.status}: No se pudo iniciar sesión. Verifica tus credenciales.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error en el inicio de sesión:', error);
      toast({
        title: 'Error de Red',
        description: 'No se pudo conectar con el servidor. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      form.control._formState.isSubmitting = false;
    }
  };

  return (
    <>
      <Head>
        <title>Iniciar Sesión - Control de Gastos</title>
        <meta name="description" content="Inicia sesión en tu cuenta de Control de Gastos." />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription>Accede a tu cuenta para controlar tus gastos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@email.com" {...field} />
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
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Tu contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Regístrate aquí
              </Link>
            </p>
            <div className="mt-4 text-center">
              <Link href="/" passHref>
                <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a la aplicación
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
