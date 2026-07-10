import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, clearTokens, getAccessToken, setTokens, getApiErrorMessage } from '@/services/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;
  pendingOtpUserId: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isBootstrapping: true,
  error: null,
  pendingOtpUserId: null,
};

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const token = await getAccessToken();
  if (!token) return null;
  const { data } = await authApi.me();
  return data.data;
});

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(email, password);
      await setTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.user;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Login failed'));
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    form: { email: string; password: string; firstName: string; lastName: string; phone?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await authApi.register(form);
      const payload = data.data;
      if (!payload.requiresOtp && payload.accessToken && payload.refreshToken) {
        await setTokens(payload.accessToken, payload.refreshToken);
      }
      return payload;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Registration failed'));
    }
  },
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (idToken: string, { rejectWithValue }) => {
    try {
      const { data } = await authApi.googleLogin(idToken);
      await setTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.user;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Google sign-in failed'));
    }
  },
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ userId, code }: { userId: string; code: string }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.verifyOtp(userId, code);
      await setTokens(data.data.accessToken, data.data.refreshToken);
      return data.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Invalid OTP'));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } catch {
    // ignore
  }
  await clearTokens();
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authApi.me();
    return data.data;
  } catch (error) {
    await clearTokens();
    return rejectWithValue(getApiErrorMessage(error));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setPendingOtpUserId(state, action: PayloadAction<string | null>) {
      state.pendingOtpUserId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.isBootstrapping = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.isBootstrapping = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.isBootstrapping = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.requiresOtp) {
          state.pendingOtpUserId = action.payload.user.id;
        } else {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.pendingOtpUserId = null;
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.pendingOtpUserId = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.pendingOtpUserId = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loadUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setPendingOtpUserId } = authSlice.actions;
export default authSlice.reducer;
