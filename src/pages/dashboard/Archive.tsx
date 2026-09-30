import * as React from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputBase,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createColumnHelper,
  flexRender,
  stockFeatures,
  useTable,
} from '@tanstack/react-table';

import type { ColumnDef, StockFeatures } from '@tanstack/react-table';

import DocumentsDialog from '../../components/DocumentsDialog';
import { carbon } from '../../theme/CarbonTheme';

import {
  API_URL,
  TYPE_OPTIONS,
  StatutChip,
  formatDate,
  type Dossier,
} from '../../lib/dossierShared';

// --------------------------------------------------
// API calls
// --------------------------------------------------

async function fetchArchive(search: string): Promise<Dossier[]> {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set('search', search.trim());
  }

  const res = await fetch(
    `${API_URL}/api/dossiers/archive?${params.toString()}`,
  );

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.error ?? "Erreur lors du chargement de l'archive.");
  }

  if (!json || !Array.isArray(json.rows)) {
    throw new Error(
      "Format de réponse invalide pour l'archive. L'API doit retourner { rows: [] }.",
    );
  }

  return json.rows;
}

async function restoreDossier(id: string) {
  const res = await fetch(
    `${API_URL}/api/dossiers/${encodeURIComponent(id)}/restore`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      body?.error ?? 'Erreur lors de la restauration du dossier.',
    );
  }

  return body;
}

// --------------------------------------------------
// Small helpers
// --------------------------------------------------

// Two-line cell: main value + smaller gray detail underneath
function TwoLine({
  main,
  sub,
}: {
  main: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: 14, lineHeight: '20px' }}>{main}</Typography>
      {sub ? (
        <Typography
          sx={{
            fontSize: 12,
            lineHeight: '16px',
            letterSpacing: '0.32px',
            color: 'text.secondary',
          }}
        >
          {sub}
        </Typography>
      ) : null}
    </Box>
  );
}

// --------------------------------------------------
// Archive page
// --------------------------------------------------

const columnHelper = createColumnHelper<StockFeatures, Dossier>();

function Archive() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [viewDossier, setViewDossier] = React.useState<Dossier | null>(null);

  const [toast, setToast] = React.useState<{
    open: boolean;
    severity: 'success' | 'error';
    message: string;
  }>({ open: false, severity: 'success', message: '' });

  const showToast = (severity: 'success' | 'error', message: string) =>
    setToast({ open: true, severity, message });

  // Debounce search
  React.useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Fetch archive
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['archive', search],
    queryFn: () => fetchArchive(search),
  });

  // Restore dossier
  const restoreMutation = useMutation({
    mutationFn: restoreDossier,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      showToast('success', 'Dossier restauré avec succès.');
    },

    onError: (err: Error) => showToast('error', err.message),
  });

  const { mutate: restore } = restoreMutation;

  const restoringId = restoreMutation.isPending
    ? (restoreMutation.variables ?? null)
    : null;

  const rows = React.useMemo(() => data ?? [], [data]);

  // Columns: 9 instead of 11, related values share a cell to avoid
  // horizontal scrolling
  const columns = React.useMemo(
    () => [
      columnHelper.accessor('numeroDossier', {
        header: 'Dossier',
        cell: (info) => (
          <TwoLine
            main={
              <Box component="span" sx={{ fontWeight: 600 }}>
                {info.getValue()}
              </Box>
            }
            sub={`Sinistre ${info.row.original.numeroSinistre}`}
          />
        ),
      }),

      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => {
          const value = info.getValue();
          return TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
        },
      }),

      columnHelper.accessor('agence', {
        header: 'Agence',
      }),

      columnHelper.accessor('client', {
        header: 'Client / Assuré',
      }),

      columnHelper.accessor('partieAdverse', {
        header: 'Partie adverse',
        cell: (info) => (
          <TwoLine
            main={info.getValue() || '-'}
            sub={info.row.original.agenceAdverse || undefined}
          />
        ),
      }),

      columnHelper.accessor('dateSinistre', {
        header: 'Date de sinistre',
        cell: (info) => formatDate(info.getValue()),
      }),

      columnHelper.accessor('statut', {
        header: 'Statut',
        cell: (info) => <StatutChip statut={info.getValue()} />,
      }),

      // Files: count + button that opens the files dialog
      columnHelper.accessor((row) => row._count?.documents ?? 0, {
        id: 'documents',
        header: 'Fichiers',
        cell: (info) => (
          <Button
            size="small"
            startIcon={<InsertDriveFileIcon fontSize="small" />}
            onClick={() => setViewDossier(info.row.original)}
            sx={{ color: 'primary.main', px: 1, minWidth: 0 }}
          >
            {info.getValue()}
          </Button>
        ),
      }),

      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const dossier = row.original;
          const isRestoring = restoringId === dossier.id;

          // Carbon ghost button with a text label instead of an icon-only action
          return (
            <Button
              size="small"
              disabled={isRestoring}
              onClick={() => restore(dossier.id)}
              startIcon={
                isRestoring ? (
                  <CircularProgress size={14} />
                ) : (
                  <RestoreRoundedIcon fontSize="small" />
                )
              }
              sx={{ color: 'primary.main', whiteSpace: 'nowrap' }}
            >
              Restaurer
            </Button>
          );
        },
      }),
    ],
    [restoringId, restore],
  );

  // TanStack Table v9
  const table = useTable({
    features: stockFeatures,
    data: rows,
    columns: columns as unknown as ColumnDef<StockFeatures, Dossier>[],
  });

  const countLabel = isLoading
    ? 'Chargement…'
    : `${rows.length} dossier${rows.length > 1 ? 's' : ''} archivé${
        rows.length > 1 ? 's' : ''
      }`;

  return (
    <Box>
      {/* Page header */}
      <Typography
        component="h1"
        sx={{ fontSize: 28, fontWeight: 400, lineHeight: '36px' }}
      >
        Archive
      </Typography>

      <Typography
        sx={{
          fontSize: 14,
          letterSpacing: '0.16px',
          color: 'text.secondary',
          mt: 0.5,
          mb: 4,
        }}
      >
        Dossiers retirés de la liste active. Restaurez un dossier pour le
        remettre en circulation.
      </Typography>

      {/* Fetch error */}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Réessayer
            </Button>
          }
        >
          {error instanceof Error
            ? error.message
            : "Erreur lors du chargement de l'archive."}
        </Alert>
      )}

      {/* Carbon table toolbar: full-width search + count */}
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          height: 48,
          bgcolor: carbon.gray10,
          '&:focus-within': {
            outline: `2px solid ${carbon.blue60}`,
            outlineOffset: '-2px',
          },
        }}
      >
        <SearchRoundedIcon
          sx={{ fontSize: 20, mx: 2, color: 'text.secondary' }}
        />

        <InputBase
          fullWidth
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher par dossier, sinistre, client ou partie adverse"
          inputProps={{ 'aria-label': "Rechercher dans l'archive" }}
          sx={{ fontSize: 14, height: '100%' }}
        />

        {searchInput && (
          <IconButton
            aria-label="Effacer la recherche"
            onClick={() => setSearchInput('')}
            sx={{ height: 48, width: 48 }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        )}

        <Typography
          sx={{
            fontSize: 12,
            letterSpacing: '0.32px',
            color: 'text.secondary',
            whiteSpace: 'nowrap',
            px: 2,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          {countLabel}
        </Typography>
      </Stack>

      {/* Table */}
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      bgcolor: carbon.gray20,
                      borderBottom: 0,
                      height: 48,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>

          <TableBody>
            {/* Loading skeleton */}
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} sx={{ height: 64 }}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {/* Data rows */}
            {!isLoading &&
              !isError &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} hover sx={{ height: 64 }}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* Empty state */}
        {!isLoading && !isError && rows.length === 0 && (
          <Stack
            sx={{
              alignItems: 'flex-start',
              py: 8,
              px: 4,
              gap: 1,
              bgcolor: carbon.gray10,
            }}
          >
            <Inventory2RoundedIcon
              sx={{ fontSize: 48, color: carbon.gray50, mb: 1 }}
            />

            <Typography sx={{ fontSize: 20, lineHeight: '28px' }}>
              {search ? 'Aucun résultat' : "L'archive est vide"}
            </Typography>

            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              {search
                ? `Aucun dossier archivé ne correspond à « ${search} ».`
                : 'Les dossiers archivés apparaîtront ici.'}
            </Typography>

            {search && (
              <Button
                onClick={() => setSearchInput('')}
                sx={{ color: 'primary.main', mt: 1, ml: -1 }}
              >
                Effacer la recherche
              </Button>
            )}
          </Stack>
        )}
      </TableContainer>

      {/* Files dialog */}
      <DocumentsDialog
        dossier={viewDossier}
        onClose={() => setViewDossier(null)}
        onToast={showToast}
      />

      {/* Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Archive;
