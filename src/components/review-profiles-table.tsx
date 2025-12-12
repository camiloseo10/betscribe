'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReviewConfiguration } from '@/app/dashboard/review-profiles/page';

interface ReviewProfilesTableProps {
  profiles: ReviewConfiguration[];
  onSelectProfile: (profile: ReviewConfiguration) => void;
  onDelete: () => void;
}

export function ReviewProfilesTable({ profiles, onSelectProfile, onDelete }: ReviewProfilesTableProps) {
  async function handleDelete(id: number) {
    await fetch(`/api/review-configurations/${id}`, {
      method: 'DELETE',
    });
    onDelete();
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plataforma</TableHead>
          <TableHead>País</TableHead>
          <TableHead>Criterio Principal</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((config) => (
          <TableRow key={config.id}>
            <TableCell>{config.platformName}</TableCell>
            <TableCell>{config.targetCountry}</TableCell>
            <TableCell>{config.mainUserCriterion}</TableCell>
            <TableCell className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => onSelectProfile(config)}>
                Seleccionar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(config.id)}>
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
