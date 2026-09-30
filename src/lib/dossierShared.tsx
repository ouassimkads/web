import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const ACCENT = '#4F5BD5';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const TYPE_OPTIONS = [
  { value: 'MATERIEL', label: 'Accident matériel' },
  { value: 'CORPOREL', label: 'Accident corporel' },
  { value: 'MARITIME', label: 'Accident maritime' },
] as const;

export type DossierType = (typeof TYPE_OPTIONS)[number]['value'];

export const STATUT_OPTIONS = [
  { value: 'OUVERT', label: 'Ouvert' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'CLOTURE', label: 'Clôturé' },
  { value: 'REJETE', label: 'Rejeté' },
] as const;

export type DossierStatut = (typeof STATUT_OPTIONS)[number]['value'];

export type Dossier = {
  id: string;
  numeroDossier: string;
  numeroSinistre: string;
  type: DossierType;
  agence: string;
  client: string;
  partieAdverse: string | null;
  agenceAdverse: string | null;
  dateSinistre: string;
  dateCloture: string | null;
  statut: DossierStatut;
  createdAt: string;
  updatedAt: string;
  _count?: { documents: number };
};

const STATUT_STYLES: Record<DossierStatut, { color: string; bg: string }> = {
  OUVERT: { color: '#2563EB', bg: alpha('#2563EB', 0.1) },
  EN_COURS: { color: '#D97706', bg: alpha('#D97706', 0.1) },
  EN_ATTENTE: { color: '#6B7280', bg: alpha('#6B7280', 0.12) },
  CLOTURE: { color: '#059669', bg: alpha('#059669', 0.1) },
  REJETE: { color: '#DC2626', bg: alpha('#DC2626', 0.1) },
};

export function getStatutLabel(statut: DossierStatut) {
  return STATUT_OPTIONS.find((o) => o.value === statut)?.label ?? statut;
}

export function StatutChip({ statut }: { statut: DossierStatut }) {
  const style = STATUT_STYLES[statut];

  return (
    <Chip
      label={getStatutLabel(statut)}
      size="small"
      sx={{
        color: style.color,
        bgcolor: style.bg,
        fontWeight: 600,
        fontSize: 12.5,
        height: 24,
        borderRadius: 1.5,
      }}
    />
  );
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
