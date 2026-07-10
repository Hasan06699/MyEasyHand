import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  authApi,
  employeeApi,
  clearTokens,
  getAccessToken,
  setTokens,
  getApiErrorMessage,
} from '@/services/api';
import type { User, EmployeeProfile } from '@/types';
import { isEmployeeRole } from '@/lib/utils';

interface AuthState {
  user: User | null;
  employee: EmployeeProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  employee: null,
  isAuthenticated: false,
  isLoading: false,
  isBootstrapping: true,
  error: null,
};

async function loadEmployeeProfile() {
  const { data } = await employeeApi.me();
  return data.data;
}

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  const token = await getAccessToken();
  if (!token) return { user: null, employee: null };

  try {
    const { data } = await authApi.me();
    const user = data.data;
    if (!isEmployeeRole(user.roleSlugs)) {
      await clearTokens();
      return rejectWithValue('This app is for employees only');
    }
    const employee = await loadEmployeeProfile();
    return { user, employee };
  } catch (error) {
    await clearTokens();
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(email, password);
      const user = data.data.user;
      if (!isEmployeeRole(user.roleSlugs)) {
        return rejectWithValue('This app is for employees only. Please use the correct app for your role.');
      }
      await setTokens(data.data.accessToken, data.data.refreshToken);
      const employee = await loadEmployeeProfile();
      return { user, employee };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Login failed'));
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
    const user = data.data;
    if (!isEmployeeRole(user.roleSlugs)) {
      await clearTokens();
      return rejectWithValue('Employee access required');
    }
    const employee = await loadEmployeeProfile();
    return { user, employee };
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
    setEmployee(state, action: PayloadAction<EmployeeProfile | null>) {
      state.employee = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.isBootstrapping = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.isBootstrapping = false;
        state.user = action.payload.user;
        state.employee = action.payload.employee;
        state.isAuthenticated = !!action.payload.user;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.isBootstrapping = false;
        state.user = null;
        state.employee = null;
        state.isAuthenticated = false;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.employee = action.payload.employee;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.employee = null;
        state.isAuthenticated = false;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.employee = action.payload.employee;
        state.isAuthenticated = true;
      })
      .addCase(loadUser.rejected, (state) => {
        state.user = null;
        state.employee = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setEmployee } = authSlice.actions;
export default authSlice.reducer;
