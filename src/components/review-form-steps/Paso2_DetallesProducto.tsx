"use client"

import { Control } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface Paso2DetallesProductoProps {
  control: Control<any>
}

export function Paso2_DetallesProducto({ control }: Paso2DetallesProductoProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="sportsVariety"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Variedad de Deportes</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Más de 30 deportes, incluyendo eSports" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="strongMarkets"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mercados Fuertes</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Fútbol, Baloncesto, Tenis" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="casinoGamesCount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cantidad de Juegos de Casino</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="mainProvider"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Proveedor Principal de Casino</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Playtech, Evolution Gaming" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="featuredGame"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Juego Destacado</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Age of the Gods, Ruleta en vivo" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="welcomeOfferType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Oferta de Bienvenida</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Bono del 100% hasta $100" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="rolloverRequirement"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Requisito de Rollover</FormLabel>
            <FormControl>
              <Input placeholder="Ej: 5x en 30 días" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="additionalPromotionsCount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Promociones Adicionales</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
