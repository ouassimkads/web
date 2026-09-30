import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import CarCrashRoundedIcon from '@mui/icons-material/CarCrashRounded';
import PersonalInjuryRoundedIcon from '@mui/icons-material/PersonalInjuryRounded';
import SailingRoundedIcon from '@mui/icons-material/SailingRounded';

const API_URL = import.meta.env.VITE_API_URL;

// IBM Carbon tokens
const carbon = {
  blue60: '#0f62fe',
  gray10: '#f4f4f4',
  gray20: '#e0e0e0',
  gray20Hover: '#e8e8e8',
  gray70: '#525252',
  gray100: '#161616',
  font: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
  // Carbon categorical data-viz palette
  purple70: '#6929c4',
  cyan50: '#1192e8',
  teal70: '#005d5d',
};

type DossierCounts = {
  total: number;
  materiel: number;
  corporel: number;
  maritime: number;
};

type DossierApi = {
  id: string;
  numeroDossier: string;
  numeroSinistre: string;
  type: 'MATERIEL' | 'CORPOREL' | 'MARITIME';
  agence: string;
  client: string;
  dateSinistre: string;
  dateCloture: string | null;
  statut: 'OUVERT' | 'EN_COURS' | 'EN_ATTENTE' | 'CLOTURE' | 'REJETE';
  createdAt: string;
  updatedAt: string;
};

type DossiersResponse = {
  rows: DossierApi[];
  nextPage: number | null;
  total: number;
};

type Statut = 'Ouvert' | 'En cours' | 'En attente' | 'Clôturé' | 'Rejeté';

type TypeBreakdownItem = {
  label: string;
  count: number;
  value: number;
  color: string;
};

/* -------------------------------------------------------------------------- */
/* API                                                                        */
/* -------------------------------------------------------------------------- */

async function fetchRecentDossiers(): Promise<DossierApi[]> {
  const response = await fetch(`${API_URL}/api/dossiers?page=0&pageSize=6`);

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error || 'Erreur lors du chargement des derniers dossiers.',
    );
  }

  const data = result as DossiersResponse;

  return data.rows ?? [];
}

async function fetchDossierCounts(): Promise<DossierCounts> {
  const types = ['MATERIEL', 'CORPOREL', 'MARITIME'] as const;

  const responses = await Promise.all([
    fetch(`${API_URL}/api/dossiers?page=0&pageSize=1`),

    ...types.map((type) =>
      fetch(`${API_URL}/api/dossiers?type=${type}&page=0&pageSize=1`),
    ),
  ]);

  const results = await Promise.all(
    responses.map(async (response) => {
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || 'Erreur lors du chargement des statistiques.',
        );
      }

      return result;
    }),
  );

  return {
    total: results[0]?.total ?? 0,
    materiel: results[1]?.total ?? 0,
    corporel: results[2]?.total ?? 0,
    maritime: results[3]?.total ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getTypeLabel(type: DossierApi['type']): string {
  switch (type) {
    case 'MATERIEL':
      return 'Matériel';

    case 'CORPOREL':
      return 'Corporel';

    case 'MARITIME':
      return 'Maritime';

    default:
      return type;
  }
}

function getStatutLabel(statut: DossierApi['statut']): Statut {
  switch (statut) {
    case 'OUVERT':
      return 'Ouvert';

    case 'EN_COURS':
      return 'En cours';

    case 'EN_ATTENTE':
      return 'En attente';

    case 'CLOTURE':
      return 'Clôturé';

    case 'REJETE':
      return 'Rejeté';

    default:
      return 'Ouvert';
  }
}

/* -------------------------------------------------------------------------- */
/* Stat tiles                                                                 */
/* -------------------------------------------------------------------------- */

const STAT_CARDS = [
  {
    label: 'Total des dossiers',
    icon: <DescriptionRoundedIcon sx={{ fontSize: 24 }} />,
    color: carbon.blue60,
  },
  {
    label: 'Accidents matériels',
    icon: <CarCrashRoundedIcon sx={{ fontSize: 24 }} />,
    color: carbon.purple70,
  },
  {
    label: 'Accidents corporels',
    icon: <PersonalInjuryRoundedIcon sx={{ fontSize: 24 }} />,
    color: carbon.cyan50,
  },
  {
    label: 'Accidents maritimes',
    icon: <SailingRoundedIcon sx={{ fontSize: 24 }} />,
    color: carbon.teal70,
  },
];

// Carbon tile: gray fill, square corners, no border or shadow
const tileSx = {
  bgcolor: carbon.gray10,
  borderRadius: 0,
};

/* -------------------------------------------------------------------------- */
/* Status (Carbon tags)                                                       */
/* -------------------------------------------------------------------------- */

const STATUT_STYLES: Record<Statut, { color: string; bg: string }> = {
  Ouvert: { color: '#0043ce', bg: '#d0e2ff' },
  'En cours': { color: '#00539a', bg: '#bae6ff' },
  'En attente': { color: '#161616', bg: '#e0e0e0' },
  Clôturé: { color: '#0e6027', bg: '#a7f0ba' },
  Rejeté: { color: '#a2191f', bg: '#ffd7d9' },
};

function StatutChip({ statut }: { statut: Statut }) {
  const style = STATUT_STYLES[statut];

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 24,
        px: 1,
        borderRadius: '24px',
        fontFamily: carbon.font,
        fontSize: 12,
        letterSpacing: '0.32px',
        color: style.color,
        bgcolor: style.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {statut}
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* Donut chart                                                                */
/* -------------------------------------------------------------------------- */

function DonutChart({
  data,
  total,
}: {
  data: TypeBreakdownItem[];
  total: number;
}) {
  const size = 250;
  const strokeWidth = 40;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={carbon.gray20}
            strokeWidth={strokeWidth}
          />

          {data.map((segment, index) => {
            const cumulative = data
              .slice(0, index)
              .reduce((sum, s) => sum + s.value, 0);

            const offset = -((cumulative / 100) * circumference);
            const dash = (segment.value / 100) * circumference;

            return (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            );
          })}
        </g>
      </svg>

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontFamily: carbon.font,
            fontSize: 32,
            fontWeight: 300,
            lineHeight: 1.25,
            color: carbon.gray100,
          }}
        >
          {total}
        </Typography>

        <Typography
          sx={{
            fontFamily: carbon.font,
            fontSize: 14,
            color: carbon.gray70,
          }}
        >
          dossiers
        </Typography>
      </Box>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export default function Overview() {
  const navigate = useNavigate();

  const [counts, setCounts] = useState<DossierCounts>({
    total: 0,
    materiel: 0,
    corporel: 0,
    maritime: 0,
  });

  const [recentDossiers, setRecentDossiers] = useState<DossierApi[]>([]);

  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  const [isLoadingCount, setIsLoadingCount] = useState(true);

  const typeBreakdown: TypeBreakdownItem[] = [
    {
      label: 'Accidents matériels',
      count: counts.materiel,
      color: carbon.purple70,
      value:
        counts.total > 0
          ? Math.round((counts.materiel / counts.total) * 100)
          : 0,
    },

    {
      label: 'Accidents corporels',
      count: counts.corporel,
      color: carbon.cyan50,
      value:
        counts.total > 0
          ? Math.round((counts.corporel / counts.total) * 100)
          : 0,
    },

    {
      label: 'Accidents maritimes',
      count: counts.maritime,
      color: carbon.teal70,
      value:
        counts.total > 0
          ? Math.round((counts.maritime / counts.total) * 100)
          : 0,
    },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      try {
        setIsLoadingCount(true);
        setIsLoadingRecent(true);

        const [countsResult, dossiersResult] = await Promise.all([
          fetchDossierCounts(),
          fetchRecentDossiers(),
        ]);

        if (!cancelled) {
          setCounts(countsResult);
          setRecentDossiers(dossiersResult);
        }
      } catch (error) {
        console.error('[DASHBOARD DATA]', error);

        if (!cancelled) {
          setCounts({
            total: 0,
            materiel: 0,
            corporel: 0,
            maritime: 0,
          });

          setRecentDossiers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCount(false);
          setIsLoadingRecent(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  const values = [
    counts.total,
    counts.materiel,
    counts.corporel,
    counts.maritime,
  ];

  return (
    <Box sx={{ fontFamily: carbon.font, color: carbon.gray100 }}>
      <Typography
        component="h1"
        sx={{
          fontFamily: carbon.font,
          fontSize: 28,
          fontWeight: 400,
          lineHeight: '36px',
        }}
      >
        Statistiques
      </Typography>

      <Typography
        sx={{
          fontFamily: carbon.font,
          fontSize: 14,
          letterSpacing: '0.16px',
          color: carbon.gray70,
          mt: 0.5,
          mb: 4,
        }}
      >
        Vue d'ensemble des activités et des statistiques.
      </Typography>

      {/* Stat tiles */}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 4,
        }}
      >
        {STAT_CARDS.map((stat, index) => (
          <Box
            key={stat.label}
            sx={{
              ...tileSx,
              p: 2,
              minHeight: 128,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderTop: `3px solid ${stat.color}`,
            }}
          >
            <Stack
              direction="row"
              sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <Typography
                sx={{
                  fontFamily: carbon.font,
                  fontSize: 14,
                  letterSpacing: '0.16px',
                  color: carbon.gray70,
                }}
              >
                {stat.label}
              </Typography>

              <Box sx={{ color: stat.color, display: 'flex' }}>{stat.icon}</Box>
            </Stack>

            <Typography
              sx={{
                fontFamily: carbon.font,
                fontSize: 42,
                fontWeight: 300,
                lineHeight: 1.19,
              }}
            >
              {isLoadingCount ? '–' : values[index]}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Chart + recent dossiers */}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1.4fr',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Donut chart */}

        <Box sx={{ ...tileSx, p: 3 }}>
          <Typography
            sx={{
              fontFamily: carbon.font,
              fontSize: 16,
              fontWeight: 600,
              mb: 3,
            }}
          >
            Répartition des dossiers par type
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{
              alignItems: 'center',
              gap: 6,
            }}
          >
            <DonutChart data={typeBreakdown} total={counts.total} />

            <Stack sx={{ gap: 1.5, width: '100%' }}>
              {typeBreakdown.map((segment) => (
                <Stack
                  key={segment.label}
                  direction="row"
                  sx={{ alignItems: 'center', gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      bgcolor: segment.color,
                      flexShrink: 0,
                    }}
                  />

                  <Typography
                    sx={{
                      fontFamily: carbon.font,
                      fontSize: 14,
                      flexGrow: 1,
                    }}
                  >
                    {segment.label}
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: carbon.font,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {segment.value}%
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Box>

        {/* Recent dossiers */}

        <Box sx={{ ...tileSx, p: 3 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontFamily: carbon.font,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Derniers dossiers ajoutés
            </Typography>

            {/* Carbon ghost button */}
            <Button
              size="small"
              disableRipple
              onClick={() => navigate('/dashboard/folders')}
              sx={{
                fontFamily: carbon.font,
                fontSize: 14,
                fontWeight: 400,
                letterSpacing: '0.16px',
                color: carbon.blue60,
                textTransform: 'none',
                borderRadius: 0,
                height: 32,
                minWidth: 0,
                px: 2,
                '&:hover': { bgcolor: carbon.gray20Hover },
                '&.Mui-focusVisible': {
                  outline: `2px solid ${carbon.blue60}`,
                  outlineOffset: '-2px',
                },
              }}
            >
              Voir tout
            </Button>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                {['N° dossier', 'Type', 'Date', 'Statut'].map((head) => (
                  <TableCell
                    key={head}
                    sx={{
                      fontFamily: carbon.font,
                      fontSize: 14,
                      fontWeight: 600,
                      color: carbon.gray100,
                      bgcolor: carbon.gray20,
                      border: 0,
                      height: 40,
                      px: 2,
                      py: 0,
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoadingRecent ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{
                      py: 4,
                      border: 0,
                      fontFamily: carbon.font,
                      fontSize: 14,
                      color: carbon.gray70,
                    }}
                  >
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : recentDossiers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{
                      py: 4,
                      border: 0,
                      fontFamily: carbon.font,
                      fontSize: 14,
                      color: carbon.gray70,
                    }}
                  >
                    Aucun dossier trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                recentDossiers.map((dossier) => (
                  <TableRow
                    key={dossier.id}
                    sx={{
                      '& td': {
                        fontFamily: carbon.font,
                        fontSize: 14,
                        letterSpacing: '0.16px',
                        color: carbon.gray100,
                        borderBottom: `1px solid ${carbon.gray20}`,
                        height: 48,
                        px: 2,
                        py: 0,
                      },
                      '&:hover td': { bgcolor: carbon.gray20Hover },
                    }}
                  >
                    <TableCell>{dossier.numeroDossier}</TableCell>

                    <TableCell>{getTypeLabel(dossier.type)}</TableCell>

                    <TableCell>
                      {new Date(dossier.dateSinistre).toLocaleDateString(
                        'fr-FR',
                        {
                          day: '2-digit',
                          month: 'short',
                        },
                      )}
                    </TableCell>

                    <TableCell>
                      <StatutChip statut={getStatutLabel(dossier.statut)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
}
