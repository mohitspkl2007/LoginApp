import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import { FloatingInput } from '../components/ui/FloatingInput';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../theme/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import API_URL from '../config/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { theme } = useTheme();

  const { login } = useAuthContext();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      toast.success(res.data.message || 'Welcome back!');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your i-SOFTZONE HRMS account">
      <form onSubmit={handleLogin}>
        <FloatingInput
          label="Email Address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          icon={Mail}
          required
        />
        <FloatingInput
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          icon={Lock}
          required
        />

        <div style={{ textAlign: 'right', marginBottom: 24, marginTop: -8 }}>
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.accent,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          icon={LogIn}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p style={{
        textAlign: 'center',
        marginTop: 28,
        fontSize: 14,
        color: theme.colors.textSecondary,
      }}>
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/signup')}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.accent,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Create account <ArrowRight size={14} />
        </button>
      </p>
    </AuthLayout>
  );
}

export default Login;
