import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ReviewConfiguration } from "@/app/dashboard/review-profiles/page";

const formSchema = z.object({
  platformName: z.string().min(1, "Este campo es requerido"),
  targetCountry: z.string().min(1, "Este campo es requerido"),
  mainUserCriterion: z.string().min(1, "Este campo es requerido"),
  secondaryUserCriterion: z.string().min(1, "Este campo es requerido"),
  rating: z.number(),
  mainLicense: z.string().min(1, "Este campo es requerido"),
  foundationYear: z.number(),
  mobileApp: z.string().min(1, "Este campo es requerido"),
  averageWithdrawalTime: z.string().min(1, "Este campo es requerido"),
  support247: z.string().min(1, "Este campo es requerido"),
  sportsVariety: z.string().min(1, "Este campo es requerido"),
  strongMarkets: z.string().min(1, "Este campo es requerido"),
  casinoGamesCount: z.number(),
  mainProvider: z.string().min(1, "Este campo es requerido"),
  featuredGame: z.string().min(1, "Este campo es requerido"),
  welcomeOfferType: z.string().min(1, "Este campo es requerido"),
  rolloverRequirement: z.string().min(1, "Este campo es requerido"),
  additionalPromotionsCount: z.number(),
  popularPaymentMethod1: z.string().min(1, "Este campo es requerido"),
  popularPaymentMethod2: z.string().min(1, "Este campo es requerido"),
  uniqueCompetitiveAdvantage: z.string().min(1, "Este campo es requerido"),
  experienceLevel: z.string().min(1, "Este campo es requerido"),
  desiredTone: z.string().min(1, "Este campo es requerido"),
  mainFocus: z.string().min(1, "Este campo es requerido"),
});

interface ReviewProfileFormProps {
  editingProfile: ReviewConfiguration | null;
  onFinished: () => void;
  onCancel: () => void;
}

export function ReviewProfileForm({ editingProfile, onFinished, onCancel }: ReviewProfileFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platformName: "",
      targetCountry: "",
      mainUserCriterion: "",
      secondaryUserCriterion: "",
      rating: 5,
      mainLicense: "",
      foundationYear: 2024,
      mobileApp: "",
      averageWithdrawalTime: "",
      support247: "",
      sportsVariety: "",
      strongMarkets: "",
      casinoGamesCount: 0,
      mainProvider: "",
      featuredGame: "",
      welcomeOfferType: "",
      rolloverRequirement: "",
      additionalPromotionsCount: 0,
      popularPaymentMethod1: "",
      popularPaymentMethod2: "",
      uniqueCompetitiveAdvantage: "",
      experienceLevel: "",
      desiredTone: "",
      mainFocus: "",
    },
  });

  useEffect(() => {
    if (editingProfile) {
      form.reset(editingProfile);
    } else {
      form.reset(form.formState.defaultValues);
    }
  }, [editingProfile, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const method = editingProfile ? 'PUT' : 'POST';
    const url = editingProfile
      ? `/api/review-configurations/${editingProfile.id}`
      : '/api/review-configurations';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    onFinished();
    onCancel(); // to reset the form
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="platformName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Plataforma</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Bet365" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="targetCountry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País Destino</FormLabel>
              <FormControl>
                <Input placeholder="Ej: México" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mainUserCriterion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Criterio Principal del Usuario</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Mejores cuotas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="secondaryUserCriterion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Criterio Secundario del Usuario</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Variedad de mercados" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calificación</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mainLicense"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Licencia Principal</FormLabel>
              <FormControl>
                <Input placeholder="Ej: MGA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="foundationYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Año de Fundación</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mobileApp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Móvil</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Sí, para iOS y Android" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="averageWithdrawalTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiempo Promedio de Retiro</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 24 horas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="support247"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Soporte 24/7</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Sí, por chat en vivo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sportsVariety"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variedad de Deportes</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Más de 30" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="strongMarkets"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mercados Fuertes</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Fútbol, NBA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="casinoGamesCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad de Juegos de Casino</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mainProvider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor Principal</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Evolution Gaming" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="featuredGame"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Juego Destacado</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Ruleta en vivo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="welcomeOfferType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Oferta de Bienvenida</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Bono del 100%" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rolloverRequirement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requisito de Rollover</FormLabel>
              <FormControl>
                <Input placeholder="Ej: x30" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="additionalPromotionsCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad de Promociones Adicionales</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="popularPaymentMethod1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pago Popular 1</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Tarjeta de crédito" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="popularPaymentMethod2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pago Popular 2</FormLabel>
              <FormControl>
                <Input placeholder="Ej: SPEI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="uniqueCompetitiveAdvantage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ventaja Competitiva Única</FormLabel>
              <FormControl>
                <Input placeholder="Ej: El mejor programa de lealtad" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="experienceLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nivel de Experiencia del Usuario</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Principiante" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="desiredTone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tono Deseado</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Experto y cercano" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mainFocus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enfoque Principal</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Apuestas deportivas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center space-x-2">
          <Button type="submit">{editingProfile ? 'Actualizar' : 'Guardar'}</Button>
          {editingProfile && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
