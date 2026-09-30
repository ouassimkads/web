import * as React from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import { renderAsync } from 'docx-preview';
import type { ColumnDef, StockFeatures } from '@tanstack/react-table';
import {
  createColumnHelper,
  flexRender,
  stockFeatures,
  useTable,
} from '@tanstack/react-table';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { carbon } from '../../theme/CarbonTheme';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const PAGE_SIZE = 8;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type DossierDocument = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

const fileUrl = (id: string, kind: 'preview' | 'download') =>
  `${API_URL}/api/documents/${id}/${kind}`;

const getExt = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

// -----------------------------------------------------------------------------
// Preview
// -----------------------------------------------------------------------------

function DocxPreview({ url }: { url: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

React.useEffect(() => {
  let cancelled = false;

  (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      if (cancelled || !ref.current) return;

      ref.current.innerHTML = '';
      await renderAsync(blob, ref.current, undefined, { inWrapper: true });

      if (!cancelled) setStatus('ready');
    } catch {
      if (!cancelled) setStatus('error');
    }
  })();

  return () => {
    cancelled = true;
  };
}, [url]);
  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        bgcolor: carbon.gray10,
      }}
    >
      {status === 'loading' && (
        <Stack
          sx={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={28} />
        </Stack>
      )}

      {status === 'error' && (
        <Alert severity="error" sx={{ m: 2 }}>
          Impossible d'afficher l'aperçu de ce document.
        </Alert>
      )}

      {/* always mounted so the ref exists when the effect runs */}
      <div ref={ref} />
    </Box>
  );
}

function FilePreview({ doc }: { doc: DossierDocument | null }) {
  if (!doc) {
    return (
      <Stack
        sx={{
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          color: 'text.secondary',
        }}
      >
        <Inventory2RoundedIcon sx={{ fontSize: 40, opacity: 0.4 }} />
        <Typography sx={{ fontSize: 14 }}>
          Sélectionnez un fichier pour l'afficher.
        </Typography>
      </Stack>
    );
  }

  const ext = getExt(doc.originalName);

  if (ext === 'pdf') {
    return (
      <iframe
        key={doc.id}
        src={fileUrl(doc.id, 'preview')}
        title={doc.originalName}
        style={{ width: '100%', height: '100%', border: 0 }}
      />
    );
  }

  if (ext === 'docx') {
    return <DocxPreview key={doc.id} url={fileUrl(doc.id, 'preview')} />;
  }

  // .doc and anything else: no reliable browser preview
  return (
    <Stack
      sx={{
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <DescriptionRoundedIcon sx={{ fontSize: 48, opacity: 0.4 }} />
      <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
        L'aperçu n'est pas disponible pour ce format (.{ext}).
      </Typography>
      <Button
        variant="outlined"
        startIcon={<DownloadRoundedIcon />}
        component="a"
        href={fileUrl(doc.id, 'download')}
      >
        Télécharger
      </Button>
    </Stack>
  );
}

// -----------------------------------------------------------------------------
// Documents API
// -----------------------------------------------------------------------------

async function fetchDocuments(dossierId: string): Promise<DossierDocument[]> {
  const res = await fetch(`${API_URL}/api/dossiers/${dossierId}/documents`);
  const result = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(result?.error || 'Erreur de chargement des fichiers.');
  return result;
}

async function uploadDocuments(dossierId: string, files: File[]) {
  const body = new FormData();
  files.forEach((f) => body.append('files', f));
  // do NOT set Content-Type: the browser adds the multipart boundary
  const res = await fetch(`${API_URL}/api/dossiers/${dossierId}/documents`, {
    method: 'POST',
    body,
  });
  const result = await res.json().catch(() => null);
  if (!res.ok) throw new Error(result?.error || "Erreur lors de l'envoi.");
  return result;
}

async function deleteDocument(id: string) {
  const res = await fetch(`${API_URL}/api/documents/${id}`, {
    method: 'DELETE',
  });
  const result = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(result?.error || 'Erreur lors de la suppression.');
  return result;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

// -----------------------------------------------------------------------------
// Options and types
// -----------------------------------------------------------------------------

const TYPE_OPTIONS = [
  { value: 'MATERIEL', label: 'Accident matériel' },
  { value: 'CORPOREL', label: 'Accident corporel' },
  { value: 'MARITIME', label: 'Accident maritime' },
] as const;

type DossierType = (typeof TYPE_OPTIONS)[number]['value'];

const AGENCE_OPTIONS = [
  '215 BL Collo',
  '216 BL Azzaba',
  '217 BL Harrouche',
  '218 BL Tamalous',
  '219 BL Sidi Mezghiche',
  '876 BL Beni Oulbane',
  '877 Bl Ben Azzouz',
];

const AGENCE_ADVERSE_OPTIONS = [
  'SAA',
  'CAAT',
  'CAAR',
  'CIAR',
  'GAM',
  'Alliance Assurances',
  'Trust Algeria',
  'AXA Assurances',
  '2A',
  'CASH Assurances',
  'Autre',
];

const STATUT_OPTIONS = [
  { value: 'OUVERT', label: 'Ouvert' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'CLOTURE', label: 'Clôturé' },
  { value: 'REJETE', label: 'Rejeté' },
] as const;

type DossierStatut = (typeof STATUT_OPTIONS)[number]['value'];

type DossierForm = {
  numeroSinistre: string;
  type: DossierType;
  agence: string;
  client: string;
  dateSinistre: string;
  statut: DossierStatut;
  partieAdverse: string;
  agenceAdverse: string;
};

type Dossier = {
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

interface Filters {
  search: string;
  type: string;
  agence: string;
  statut: string;
}

interface DossiersPage {
  rows: Dossier[];
  nextPage: number | null;
  total: number;
}

// -----------------------------------------------------------------------------
// Documents dialog
// -----------------------------------------------------------------------------

function DocumentsDialog({
  dossier,
  onClose,
  onToast,
}: {
  dossier: Dossier | null;
  onClose: () => void;
  onToast: (severity: 'success' | 'error', message: string) => void;
}) {
  const queryClient = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const dossierId = dossier?.id;

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', dossierId],
    queryFn: () => fetchDocuments(dossierId!),
    enabled: !!dossierId,
  });

  // falls back to the first file if nothing (or a deleted file) is selected
  const selected =
    documents.find((d) => d.id === selectedId) ?? documents[0] ?? null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['documents', dossierId] });
    queryClient.invalidateQueries({ queryKey: ['dossiers'] });
  };

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadDocuments(dossierId!, files),
    onSuccess: () => {
      onToast('success', 'Fichier(s) ajouté(s) avec succès.');
      refresh();
    },
    onError: (err: Error) => onToast('error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      onToast('success', 'Fichier supprimé.');
      refresh();
    },
    onError: (err: Error) => onToast('error', err.message),
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length > 0) uploadMutation.mutate(files);
  };

  return (
    <Dialog
      open={!!dossier}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      slotProps={{ paper: { sx: { height: '90vh' } } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        Fichiers du dossier {dossier?.numeroDossier}
        <IconButton size="small" onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
        }}
      >
        {/* Left: list */}
        <Box
          sx={{
            width: { xs: '100%', md: 360 },
            height: { xs: 220, md: '100%' },
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: { md: '1px solid' },
            borderBottom: { xs: '1px solid', md: 0 },
            borderColor: 'divider',
          }}
        >
          <Box sx={{ p: 2 }}>
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFiles}
            />

            <Button
              fullWidth
              variant="outlined"
              startIcon={
                uploadMutation.isPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <UploadFileRoundedIcon />
                )
              }
              disabled={uploadMutation.isPending}
              onClick={() => inputRef.current?.click()}
              sx={{ justifyContent: 'flex-start' }}
            >
              Ajouter des fichiers
            </Button>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {isLoading ? (
              <Box sx={{ px: 2 }}>
                <Skeleton variant="rectangular" height={56} />
              </Box>
            ) : documents.length === 0 ? (
              <Typography sx={{ px: 2, fontSize: 14, color: 'text.secondary' }}>
                Aucun fichier pour ce dossier.
              </Typography>
            ) : (
              <List disablePadding>
                {documents.map((doc) => (
                  <ListItem
                    key={doc.id}
                    disablePadding
                    secondaryAction={
                      <Stack direction="row" spacing={0}>
                        <Tooltip title="Télécharger">
                          <IconButton
                            size="small"
                            component="a"
                            href={fileUrl(doc.id, 'download')}
                          >
                            <DownloadRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            color="error"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(doc.id)}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  >
                    <ListItemButton
                      selected={selected?.id === doc.id}
                      onClick={() => setSelectedId(doc.id)}
                      sx={{ pr: 12 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {getExt(doc.originalName) === 'pdf' ? (
                          <PictureAsPdfRoundedIcon
                            fontSize="small"
                            color="error"
                          />
                        ) : (
                          <DescriptionRoundedIcon
                            fontSize="small"
                            color="primary"
                          />
                        )}
                      </ListItemIcon>

                      <ListItemText
                        primary={doc.originalName}
                        secondary={`${formatSize(doc.size)} · ${new Date(
                          doc.createdAt,
                        ).toLocaleDateString('fr-FR')}`}
                        slotProps={{
                          primary: { noWrap: true, sx: { fontSize: 14 } },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>

        {/* Right: preview */}
        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <FilePreview doc={selected} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------------------------
// Empty form
// -----------------------------------------------------------------------------

const createEmptyForm = (): DossierForm => ({
  numeroSinistre: '',
  type: 'MATERIEL',
  agence: AGENCE_OPTIONS[0],
  client: '',
  dateSinistre: new Date().toISOString().slice(0, 10),
  statut: 'OUVERT',
  partieAdverse: '',
  agenceAdverse: '',
});

// -----------------------------------------------------------------------------
// Dossiers API
// -----------------------------------------------------------------------------

async function fetchDossiersPage(
  pageParam: number,
  filters: Filters,
): Promise<DossiersPage> {
  const params = new URLSearchParams();

  params.set('page', String(pageParam));
  params.set('pageSize', String(PAGE_SIZE));

  const search = filters.search.trim();

  if (search) {
    params.set('search', search);
  }

  if (filters.type !== 'Tous') {
    params.set('type', filters.type);
  }

  if (filters.agence !== 'Toutes') {
    params.set('agence', filters.agence);
  }

  if (filters.statut !== 'Tous') {
    params.set('statut', filters.statut);
  }

  const response = await fetch(`${API_URL}/api/dossiers?${params.toString()}`);

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || 'Erreur lors du chargement des dossiers.');
  }

  return result;
}

const toPayload = (form: DossierForm) => ({
  numeroSinistre: form.numeroSinistre.trim(),
  type: form.type,
  agence: form.agence,
  client: form.client.trim(),
  dateSinistre: form.dateSinistre,
  statut: form.statut,
  partieAdverse: form.partieAdverse.trim(),
  agenceAdverse: form.agenceAdverse,
});

async function createDossier(form: DossierForm): Promise<Dossier> {
  const response = await fetch(`${API_URL}/api/dossiers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toPayload(form)),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || 'Erreur lors de la création du dossier.');
  }

  return result;
}

async function updateDossier(id: string, form: DossierForm): Promise<Dossier> {
  const response = await fetch(`${API_URL}/api/dossiers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toPayload(form)),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error || 'Erreur lors de la modification du dossier.',
    );
  }

  return result;
}

async function deleteDossier(id: string) {
  const response = await fetch(`${API_URL}/api/dossiers/${id}`, {
    method: 'DELETE',
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error || 'Erreur lors de la suppression du dossier.',
    );
  }

  return result;
}

// -----------------------------------------------------------------------------
// Statut tags (Carbon)
// -----------------------------------------------------------------------------

const STATUT_STYLES: Record<DossierStatut, { color: string; bg: string }> = {
  OUVERT: { color: '#0043ce', bg: '#d0e2ff' },
  EN_COURS: { color: '#00539a', bg: '#bae6ff' },
  EN_ATTENTE: { color: '#161616', bg: '#e0e0e0' },
  CLOTURE: { color: '#0e6027', bg: '#a7f0ba' },
  REJETE: { color: '#a2191f', bg: '#ffd7d9' },
};

function getStatutLabel(statut: DossierStatut) {
  return (
    STATUT_OPTIONS.find((option) => option.value === statut)?.label ?? statut
  );
}

function StatutChip({ statut }: { statut: DossierStatut }) {
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
        fontSize: 12,
        letterSpacing: '0.32px',
        color: style.color,
        bgcolor: style.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {getStatutLabel(statut)}
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function Folders() {
  const queryClient = useQueryClient();

  // Filters
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('Tous');
  const [agence, setAgence] = React.useState('Toutes');
  const [statut, setStatut] = React.useState('Tous');

  const [viewDossier, setViewDossier] = React.useState<Dossier | null>(null);

  // Delete
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletePin, setDeletePin] = React.useState('');
  const [selectedDeleteId, setSelectedDeleteId] = React.useState<string | null>(
    null,
  );

  // Edit / Create
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<DossierForm>(createEmptyForm);
  const [isCreating, setIsCreating] = React.useState(false);

  // Snackbar
  const [toast, setToast] = React.useState<{
    open: boolean;
    severity: 'success' | 'error';
    message: string;
  }>({
    open: false,
    severity: 'success',
    message: '',
  });

  // Search debounce
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
    }, 350);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchInput]);

  const filters = React.useMemo<Filters>(
    () => ({ search, type, agence, statut }),
    [search, type, agence, statut],
  );

  const hasActiveFilters =
    search !== '' ||
    type !== 'Tous' ||
    agence !== 'Toutes' ||
    statut !== 'Tous';

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setType('Tous');
    setAgence('Toutes');
    setStatut('Tous');
  };

  // React Query
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['dossiers', filters],
    queryFn: ({ pageParam }) => fetchDossiersPage(pageParam, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const tableData = React.useMemo(
    () => data?.pages.flatMap((page) => page.rows) ?? [],
    [data],
  );

  const total = data?.pages[0]?.total ?? 0;

  // Infinite scroll
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = sentinelRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Delete
  const handleDelete = React.useCallback(
    async (id: string) => {
      if (isDeleting) {
        return;
      }

      try {
        setIsDeleting(true);
        setDeleteId(id);

        await deleteDossier(id);

        await queryClient.invalidateQueries({ queryKey: ['dossiers'] });

        setToast({
          open: true,
          severity: 'success',
          message: 'Dossier supprimé avec succès.',
        });
      } catch (err) {
        console.error('[DELETE DOSSIER]', err);

        setToast({
          open: true,
          severity: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Erreur lors de la suppression du dossier.',
        });
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    },
    [isDeleting, queryClient],
  );

  // Edit
  const handleEdit = React.useCallback((dossier: Dossier) => {
    setEditingId(dossier.id);

    setForm({
      numeroSinistre: dossier.numeroSinistre,
      type: dossier.type,
      agence: dossier.agence,
      client: dossier.client,
      dateSinistre: dossier.dateSinistre.slice(0, 10),
      statut: dossier.statut,
      partieAdverse: dossier.partieAdverse ?? '',
      agenceAdverse: dossier.agenceAdverse ?? '',
    });

    setDialogOpen(true);
  }, []);

  // Table columns
  const columns = React.useMemo(() => {
    
    const columnHelper = createColumnHelper<StockFeatures, Dossier>();
    return [
      columnHelper.accessor('numeroDossier', {
        header: 'N° dossier',
        cell: (info) => (
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            {info.getValue()}
          </Typography>
        ),
      }),

      columnHelper.accessor('numeroSinistre', {
        header: 'N° sinistre',
        cell: (info) => (
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            {info.getValue()}
          </Typography>
        ),
      }),

      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => {
          const value = info.getValue();

          return (
            TYPE_OPTIONS.find((option) => option.value === value)?.label ??
            value
          );
        },
      }),

      columnHelper.accessor('agence', { header: 'Agence' }),

      columnHelper.accessor('client', { header: 'Client / Assuré' }),

      columnHelper.accessor('partieAdverse', {
        header: 'Partie adverse',
        cell: (info) => info.getValue() || '-',
      }),

      columnHelper.accessor('agenceAdverse', {
        header: 'Agence adverse',
        cell: (info) => info.getValue() || '-',
      }),

      columnHelper.accessor('dateSinistre', {
        header: 'Date de sinistre',
        cell: (info) => {
          const value = info.getValue();

          if (!value) {
            return '-';
          }

          const date = new Date(value);

          if (Number.isNaN(date.getTime())) {
            return value;
          }

          return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
        },
      }),

      columnHelper.accessor('statut', {
        header: 'Statut',
        cell: (info) => <StatutChip statut={info.getValue()} />,
      }),

      columnHelper.accessor((row) => row._count?.documents ?? 0, {
        id: 'documents',
        header: 'Fichiers',
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const dossier = row.original;

          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Fichiers">
                <IconButton
                  size="small"
                  onClick={() => setViewDossier(dossier)}
                >
                  <InsertDriveFileIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Modifier">
                <IconButton size="small" onClick={() => handleEdit(dossier)}>
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Supprimer">
                <IconButton
                  size="small"
                  color="error"
                  disabled={isDeleting}
                  onClick={() => {
                    setSelectedDeleteId(dossier.id);
                    setDeletePin('');
                    setDeleteDialogOpen(true);
                  }}
                >
                  {isDeleting && deleteId === dossier.id ? (
                    <CircularProgress size={18} />
                  ) : (
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      }),
    ];
  }, [isDeleting, deleteId, handleEdit]);

  const table = useTable({
    features: stockFeatures,
    data: tableData,
    columns: columns as unknown as ColumnDef<StockFeatures, Dossier>[],
  });

  // Form
  const canSubmit =
    form.numeroSinistre.trim() !== '' &&
    form.client.trim() !== '' &&
    form.dateSinistre !== '';

  const handleOpen = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!canSubmit || isCreating) {
      return;
    }

    try {
      setIsCreating(true);

      if (editingId) {
        await updateDossier(editingId, form);

        setToast({
          open: true,
          severity: 'success',
          message: 'Dossier modifié avec succès.',
        });
      } else {
        await createDossier(form);

        setToast({
          open: true,
          severity: 'success',
          message: 'Dossier ajouté avec succès.',
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['dossiers'] });

      setDialogOpen(false);
      setEditingId(null);
      setForm(createEmptyForm());
    } catch (err) {
      console.error('[SAVE DOSSIER]', err);

      setToast({
        open: true,
        severity: 'error',
        message:
          err instanceof Error ? err.message : 'Une erreur est survenue.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) {
      return;
    }

    setDialogOpen(false);
  };

  const handleField =
    (field: keyof DossierForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((previous) => ({
        ...previous,
        [field]: e.target.value,
      }));
    };

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'Erreur lors du chargement des dossiers.';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      {/* Header */}

      <Stack
        direction="row"
        sx={{
          mb: 4,
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{ fontSize: 28, fontWeight: 400, lineHeight: '36px' }}
          >
            Dossiers
          </Typography>

          <Typography
            sx={{
              fontSize: 14,
              letterSpacing: '0.16px',
              color: 'text.secondary',
              mt: 0.5,
            }}
          >
            {isLoading
              ? 'Chargement…'
              : `${tableData.length} sur ${total} dossier${
                  total > 1 ? 's' : ''
                }`}
          </Typography>
        </Box>

        {/* Carbon primary button: label left, icon right */}
        <Button
          variant="contained"
          endIcon={<AddRoundedIcon />}
          onClick={handleOpen}
          sx={{
            height: 48,
            minWidth: 240,
            justifyContent: 'space-between',
          }}
        >
          Ajouter un dossier
        </Button>
      </Stack>

      {/* Search + filters */}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{ gap: 2, mb: 3, alignItems: { md: 'flex-start' } }}
      >
        <TextField
          hiddenLabel
          size="small"
          placeholder="Rechercher un dossier, un sinistre, un client…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ flexGrow: 1, minWidth: { md: 260 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon
                    fontSize="small"
                    sx={{ color: 'text.secondary' }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          size="small"
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="Tous">Tous les types</MenuItem>

          {TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Agence"
          value={agence}
          onChange={(e) => setAgence(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="Toutes">Toutes les agences</MenuItem>

          {AGENCE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Statut"
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="Tous">Tous les statuts</MenuItem>

          {STATUT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {hasActiveFilters && (
          <Button
            onClick={resetFilters}
            startIcon={<TuneRoundedIcon fontSize="small" />}
            sx={{
              color: 'primary.main',
              whiteSpace: 'nowrap',
              height: 48,
            }}
          >
            Réinitialiser
          </Button>
        )}
      </Stack>

      {/* API error */}

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
          {errorMessage}
        </Alert>
      )}

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
            {/* Loading */}

            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, columnIndex) => (
                    <TableCell key={columnIndex}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {/* Rows */}

            {!isLoading &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} hover sx={{ height: 56 }}>
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

            {/* Empty */}

            {!isLoading && !isError && tableData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ borderBottom: 0 }}>
                  <Stack
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 6,
                      gap: 1,
                      color: 'text.secondary',
                    }}
                  >
                    <Inventory2RoundedIcon
                      sx={{ fontSize: 32, opacity: 0.4 }}
                    />

                    <Typography sx={{ fontSize: 14 }}>
                      Aucun dossier ne correspond à votre recherche.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Infinite scroll */}

        {!isLoading && hasNextPage && (
          <Box
            ref={sentinelRef}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 2.5,
              gap: 1,
            }}
          >
            <CircularProgress size={16} />

            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Chargement des dossiers suivants…
            </Typography>
          </Box>
        )}

        {!isLoading && !hasNextPage && tableData.length > 0 && (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
              Fin de la liste
            </Typography>
          </Box>
        )}

        {!isLoading && isFetching && !isFetchingNextPage && (
          <Box sx={{ py: 1, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
              Actualisation…
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* Create / Edit dialog */}

      <Dialog open={dialogOpen} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {editingId ? 'Modifier le dossier' : 'Créer un dossier'}

          <IconButton size="small" onClick={handleClose} disabled={isCreating}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2.5,
            }}
          >
            <TextField
              label="N° sinistre"
              placeholder="SIN-88221"
              value={form.numeroSinistre}
              onChange={handleField('numeroSinistre')}
              required
              size="small"
              disabled={isCreating}
            />

            <TextField
              label="Client / Assuré"
              placeholder="Nom du client"
              value={form.client}
              onChange={handleField('client')}
              required
              size="small"
              disabled={isCreating}
            />

            <TextField
              select
              label="Type"
              value={form.type}
              onChange={handleField('type')}
              size="small"
              disabled={isCreating}
            >
              {TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Agence"
              value={form.agence}
              onChange={handleField('agence')}
              size="small"
              disabled={isCreating}
            >
              {AGENCE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Date de sinistre"
              type="date"
              value={form.dateSinistre}
              onChange={handleField('dateSinistre')}
              size="small"
              disabled={isCreating}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              select
              label="Statut"
              value={form.statut}
              onChange={handleField('statut')}
              size="small"
              disabled={isCreating}
            >
              {STATUT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Partie adverse"
              placeholder="Nom de la partie adverse"
              value={form.partieAdverse}
              onChange={handleField('partieAdverse')}
              size="small"
              disabled={isCreating}
            />

            <TextField
              select
              label="Agence adverse"
              value={form.agenceAdverse}
              onChange={handleField('agenceAdverse')}
              size="small"
              disabled={isCreating}
              slotProps={{
                inputLabel: { shrink: true },
                select: { displayEmpty: true },
              }}
            >
              <MenuItem value="">
                <em>Non renseignée</em>
              </MenuItem>

              {AGENCE_ADVERSE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          {/* Carbon secondary button */}
          <Button
            onClick={handleClose}
            disabled={isCreating}
            sx={{
              bgcolor: carbon.gray80,
              color: '#fff',
              height: 48,
              px: 3,
              '&:hover': { bgcolor: '#4c4c4c' },
            }}
          >
            Annuler
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canSubmit || isCreating}
            sx={{ height: 48, px: 3 }}
          >
            {isCreating
              ? editingId
                ? 'Modification…'
                : 'Création…'
              : editingId
                ? 'Enregistrer les modifications'
                : 'Créer le dossier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Code PIN"
            type="password"
            value={deletePin}
            onChange={(e) => setDeletePin(e.target.value)}
            size="small"
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              bgcolor: carbon.gray80,
              color: '#fff',
              height: 48,
              px: 3,
              '&:hover': { bgcolor: '#4c4c4c' },
            }}
          >
            Annuler
          </Button>

          <Button
            color="error"
            variant="contained"
            sx={{ height: 48, px: 3 }}
            onClick={() => {
              if (deletePin === '2026' && selectedDeleteId) {
                handleDelete(selectedDeleteId);

                setDeleteDialogOpen(false);

                setDeletePin('');
              }
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <DocumentsDialog
        dossier={viewDossier}
        onClose={() => setViewDossier(null)}
        onToast={(severity, message) =>
          setToast({ open: true, severity, message })
        }
      />

      {/* Snackbar */}

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((previous) => ({ ...previous, open: false }))}
          severity={toast.severity}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Folders;
