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

interface Paso1InfoPlataformaProps {
  control: Control<any>
}

export function Paso1_InfoPlataforma({ control }: Paso1InfoPlataformaProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="nombrePlataforma"
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
        control={control}
        name="tipoPlataforma"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Plataforma</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Casa de apuestas, Casino online" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="mercadoObjetivo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mercado Objetivo</FormLabel>
            <FormControl>
              <Input placeholder="Ej: México, España" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="secondaryUserCriterion"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Criterio Secundario del Usuario</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Variedad de mercados, App móvil" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="rating"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rating (1-5)</FormLabel>
            <FormControl>
              <Input type="number" min="1" max="5" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="mainLicense"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Licencia Principal</FormLabel>
            <FormControl>
              <Input placeholder="Ej: MGA, SEGOB" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="foundationYear"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Año de Fundación</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField
        control={control}
        name="mobileApp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>App Móvil</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Sí, No, App para iOS y Android" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
