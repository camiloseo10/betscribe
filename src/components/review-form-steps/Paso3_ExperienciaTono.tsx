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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Paso3ExperienciaTonoProps {
  control: Control<any>
}

export function Paso3_ExperienciaTono({ control }: Paso3ExperienciaTonoProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="averageWithdrawalTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tiempo Promedio de Retiro</FormLabel>
            <FormControl>
              <Input placeholder="Ej: 24 horas, 3-5 días" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="support247"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Soporte 24/7</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Sí, No, Chat en vivo y correo" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
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
        control={control}
        name="popularPaymentMethod2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Método de Pago Popular 2</FormLabel>
            <FormControl>
              <Input placeholder="Ej: PayPal" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
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
        control={control}
        name="experienceLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nivel de Experiencia del Usuario</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Principiante, Intermedio, Avanzado" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="desiredTone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tono Deseado</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Crítico y analítico, Entusiasta y amigable" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="mainFocus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Enfoque Principal de la Reseña</FormLabel>
            <FormControl>
              <Input placeholder="Ej: Seguridad y licencias, Bonos y promociones" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="language"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Idioma</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un idioma" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">Inglés</SelectItem>
                <SelectItem value="pt">Portugués</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="wordCount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número de Palabras</FormLabel>
            <FormControl>
              <Input type="number" placeholder="3000" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
