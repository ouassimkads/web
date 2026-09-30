import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

// IBM Carbon tokens (White / Gray 10 theme)
const carbon = {
  blue60: '#0f62fe',
  blue60Hover: '#0353e9',
  blue80Active: '#002d9c',
  gray10: '#f4f4f4',
  gray30: '#c6c6c6',
  gray50: '#8d8d8d',
  gray70: '#525252',
  gray100: '#161616',
  red60: '#da1e28',
  red10: '#fff1f1',
  white: '#ffffff',
  font: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
};

// Carbon text input: gray fill, bottom border only, 2px blue focus outline
const inputSx = {
  '& .MuiFilledInput-root': {
    height: 40,
    borderRadius: 0,
    bgcolor: carbon.gray10,
    fontFamily: carbon.font,
    fontSize: 14,
    color: carbon.gray100,
    borderBottom: `1px solid ${carbon.gray50}`,
    transition: 'none',
    '&:before, &:after': { display: 'none' },
    '&:hover': { bgcolor: '#e8e8e8' },
    '&.Mui-focused': {
      bgcolor: carbon.gray10,
      outline: `2px solid ${carbon.blue60}`,
      outlineOffset: '-2px',
      borderBottomColor: 'transparent',
    },
  },
  '& .MuiFilledInput-input': { px: 2, py: 0, height: '100%' },
};

const labelSx = {
  display: 'block',
  fontFamily: carbon.font,
  fontSize: 12,
  letterSpacing: '0.32px',
  color: carbon.gray70,
  mb: 1,
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { checkAuth } = useAuth(); // 2. جلب دالة التحديث من الـ Context

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? 'E-mail ou mot de passe incorrect.');
        return;
      }

      // 3. تحديث حالة التوثيق ليتسنى لـ ProtectedRoute معرفة أن المستخدم أصبح متاحاً
      await checkAuth();

      const next = searchParams.get('next') ?? '/dashboard/overview';
      navigate(next, { replace: true });
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: carbon.gray10,
        fontFamily: carbon.font,
        px: 2,
      }}
    >
      {/* Carbon tile: white, square corners, no shadow */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          bgcolor: carbon.white,
          borderTop: `3px solid ${carbon.blue60}`,
          p: 4,
        }}
      >
        <Box sx={{ mb: 4 }}>
          <img src="/images.png" alt="logo" width={40} />
        </Box>

        <Typography
          component="h1"
          sx={{
            fontFamily: carbon.font,
            fontSize: 28,
            fontWeight: 400,
            lineHeight: '36px',
            color: carbon.gray100,
          }}
        >
          Connexion
        </Typography>

        <Typography
          sx={{
            fontFamily: carbon.font,
            fontSize: 14,
            letterSpacing: '0.16px',
            color: carbon.gray70,
            mt: 1,
            mb: 4,
          }}
        >
          Accédez à votre espace administrateur.
        </Typography>

        {/* Carbon inline error notification */}
        {error && (
          <Box
            role="alert"
            sx={{
              mb: 3,
              px: 2,
              py: 1.5,
              bgcolor: carbon.red10,
              borderLeft: `3px solid ${carbon.red60}`,
              fontFamily: carbon.font,
              fontSize: 14,
              color: carbon.gray100,
            }}
          >
            {error}
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Box component="label" htmlFor="email" sx={labelSx}>
            Adresse e-mail
          </Box>
          <TextField
            id="email"
            variant="filled"
            hiddenLabel
            type="email"
            placeholder="nom@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            sx={{ ...inputSx, mb: 3 }}
          />

          <Box component="label" htmlFor="password" sx={labelSx}>
            Mot de passe
          </Box>
          <TextField
            id="password"
            variant="filled"
            hiddenLabel
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            sx={{ ...inputSx, mb: 5 }}
          />

          {/* Carbon primary button: 48px, square, label left, icon right */}
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disableRipple
            fullWidth
            disabled={loading}
            endIcon={
              loading ? (
                <CircularProgress size={16} sx={{ color: carbon.white }} />
              ) : undefined
            }
            sx={{
              height: 48,
              borderRadius: 0,
              justifyContent: 'space-between',
              px: 2,
              pr: 2,
              fontFamily: carbon.font,
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: '0.16px',
              textTransform: 'none',
              bgcolor: carbon.blue60,
              color: carbon.white,
              '&:hover': { bgcolor: carbon.blue60Hover },
              '&:active': { bgcolor: carbon.blue80Active },
              '&.Mui-focusVisible, &:focus-visible': {
                outline: `2px solid ${carbon.blue60}`,
                outlineOffset: '-4px',
                boxShadow: `inset 0 0 0 1px ${carbon.white}`,
              },
              '&.Mui-disabled': {
                bgcolor: carbon.gray30,
                color: carbon.gray50,
              },
            }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
