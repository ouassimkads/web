import * as React from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';

import { renderAsync } from 'docx-preview';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { API_URL } from '../lib/dossierShared';

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

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

// ---------------------------------------------------------------- API

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

// ---------------------------------------------------------------- Preview

function DocxPreview({ url }: { url: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  React.useEffect(() => {
    let cancelled = false;
    setStatus('loading');

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
        bgcolor: '#F3F4F6',
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
        <Typography sx={{ fontSize: 13.5 }}>
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
      <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
        L'aperçu n'est pas disponible pour ce format (.{ext}).
      </Typography>
      <Button
        variant="outlined"
        startIcon={<DownloadRoundedIcon />}
        component="a"
        href={fileUrl(doc.id, 'download')}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        Télécharger
      </Button>
    </Stack>
  );
}

// ---------------------------------------------------------------- Dialog

export default function DocumentsDialog({
  dossier,
  onClose,
  onToast,
}: {
  dossier: { id: string; numeroDossier: string } | null;
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

  const selected =
    documents.find((d) => d.id === selectedId) ?? documents[0] ?? null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['documents', dossierId] });
    queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    queryClient.invalidateQueries({ queryKey: ['archive'] });
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
      slotProps={{ paper: { sx: { borderRadius: 3, height: '90vh' } } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 16,
          fontWeight: 700,
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
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Ajouter des fichiers
            </Button>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {isLoading ? (
              <Box sx={{ px: 2 }}>
                <Skeleton variant="rounded" height={56} />
              </Box>
            ) : documents.length === 0 ? (
              <Typography
                sx={{ px: 2, fontSize: 13.5, color: 'text.secondary' }}
              >
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
                          primary: { noWrap: true, sx: { fontSize: 13.5 } },
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
