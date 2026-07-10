'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Stack,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Avatar,
} from '@mui/material';
import { IconTrash, IconEdit, IconPhoto, IconCheck, IconX } from '@tabler/icons-react';
import { Icon } from '@iconify/react';
import {
  categoryApi,
  categoryRequestApi,
  mediaApi,
  getApiErrorMessage,
  CategoryItem,
  CategoryRequestItem,
  DEFAULT_CATEGORY_ICON,
  getCategoryParentId,
  orderCategoriesHierarchically,
} from '@/lib/api';
import IconPicker from '@/components/services/IconPicker';
import { useAuthStore } from '@/stores/auth.store';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

const emptyForm = {
  name: '',
  description: '',
  icon: '',
  image: '',
  sortOrder: 0,
  parentId: '',
  isActive: true,
};

const emptyRequestForm = {
  name: '',
  description: '',
  parentId: '',
  sortOrder: 0,
};

function getDescendantIds(categoryId: string, categories: CategoryItem[]): Set<string> {
  const descendants = new Set<string>();
  const stack = [categoryId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    categories
      .filter((category) => getCategoryParentId(category) === current)
      .forEach((child) => {
        descendants.add(child._id);
        stack.push(child._id);
      });
  }

  return descendants;
}

function getCategoryDepth(category: CategoryItem, categories: CategoryItem[]): number {
  let depth = 0;
  let parentId = getCategoryParentId(category);

  while (parentId) {
    depth += 1;
    const parent = categories.find((item) => item._id === parentId);
    parentId = parent ? getCategoryParentId(parent) : null;
  }

  return depth;
}

function getParentLabel(category: CategoryItem, categories: CategoryItem[]): string {
  const depth = getCategoryDepth(category, categories);
  return `${depth > 0 ? '— '.repeat(depth) : ''}${category.name}`;
}

function getRequestParentName(request: CategoryRequestItem): string {
  if (!request.parentId) return '—';
  if (typeof request.parentId === 'object') return request.parentId.name;
  return '—';
}

function statusColor(status: CategoryRequestItem['status']): 'warning' | 'success' | 'error' | 'default' {
  if (status === 'pending') return 'warning';
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  return 'default';
}

function isIconifyIcon(value?: string): boolean {
  return !!value && value.includes(':') && !value.startsWith('http');
}

function CategoryIconPreview({
  category,
  size = 40,
}: {
  category: CategoryItem;
  size?: number;
}) {
  const icon = isIconifyIcon(category.icon) ? category.icon! : DEFAULT_CATEGORY_ICON;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'action.hover',
      }}
    >
      <Icon icon={icon} width={Math.round(size * 0.55)} />
    </Box>
  );
}

function CategoryImagePreview({
  category,
  size = 40,
}: {
  category: CategoryItem;
  size?: number;
}) {
  if (!category.image) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  return (
    <Avatar src={category.image} variant="rounded" sx={{ width: size, height: size }} />
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roleSlugs?.includes('super_admin');
  const isBusinessOwner = user?.roleSlugs?.includes('business_owner');

  const [open, setOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', isSuperAdmin],
    queryFn: async () => {
      const res = await categoryApi.list({ includeInactive: isSuperAdmin });
      return res.data.data;
    },
  });

  const { data: categoryRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['category-requests'],
    queryFn: async () => {
      const res = await categoryRequestApi.list(isSuperAdmin ? 'pending' : undefined);
      return res.data.data;
    },
    enabled: isSuperAdmin || isBusinessOwner,
  });

  const orderedCategories = categories ? orderCategoriesHierarchically(categories) : [];
  const parentOptions = orderedCategories.filter((category) => {
    if (!editing) return true;
    if (category._id === editing._id) return false;
    return !getDescendantIds(editing._id, categories || []).has(category._id);
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        image: form.image || undefined,
        sortOrder: form.sortOrder,
        parentId: form.parentId || null,
      };
      if (editing) {
        return categoryApi.update(editing._id, { ...payload, isActive: form.isActive });
      }
      return categoryApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      handleClose();
    },
    onError: (err: unknown) => {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to save category',
      );
    },
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      categoryRequestApi.create({
        name: requestForm.name,
        description: requestForm.description,
        parentId: requestForm.parentId || null,
        sortOrder: requestForm.sortOrder,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-requests'] });
      setRequestOpen(false);
      setRequestForm(emptyRequestForm);
      setRequestError('');
    },
    onError: (err: unknown) => {
      setRequestError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to submit category request',
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => categoryRequestApi.approve(id, reviewNote || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-requests'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      setReviewNote('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => categoryRequestApi.reject(id, reviewNote || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-requests'] });
      setReviewNote('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      setDeleteError('');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
    },
    onError: (err: unknown) => {
      setDeleteError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to delete category',
      );
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images are allowed');
      return;
    }

    setUploadingImage(true);
    setError('');
    try {
      const res = await mediaApi.uploadCategoryImage(file);
      const url = res.data.data.url;
      setForm((prev) => ({ ...prev, image: url }));
      setImagePreview(url);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Image upload failed'));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImagePreview(null);
    setError('');
    setOpen(true);
  };

  const handleOpenEdit = (category: CategoryItem) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon && category.icon !== DEFAULT_CATEGORY_ICON ? category.icon : '',
      image: category.image || '',
      sortOrder: category.sortOrder,
      parentId: getCategoryParentId(category) || '',
      isActive: category.isActive,
    });
    setImagePreview(category.image || null);
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setImagePreview(null);
    setError('');
  };

  const pendingRequests = categoryRequests?.filter((r) => r.status === 'pending') || [];
  const ownerRequests = isBusinessOwner ? categoryRequests || [] : [];

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Service Categories
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isSuperAdmin
              ? 'Global categories shared by all businesses'
              : 'View global categories and request new ones for admin approval'}
          </Typography>
        </Box>
        {isSuperAdmin && (
          <Button variant="contained" onClick={handleOpenCreate}>
            Add Category
          </Button>
        )}
        {isBusinessOwner && !isSuperAdmin && (
          <Button variant="contained" onClick={() => setRequestOpen(true)}>
            Request Category
          </Button>
        )}
      </Stack>

      {isSuperAdmin && pendingRequests.length > 0 && (
        <DashboardCard title={`Pending Requests (${pendingRequests.length})`}>
          <Paper variant="outlined" sx={{ overflowX: 'auto', mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Requested Name</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Business</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <Typography fontWeight={600}>{request.name}</Typography>
                      {request.description && (
                        <Typography variant="caption" color="textSecondary">
                          {request.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getRequestParentName(request)}</TableCell>
                    <TableCell>
                      {typeof request.businessId === 'object' ? request.businessId.name : '—'}
                    </TableCell>
                    <TableCell>
                      {request.requestedBy
                        ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}`
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="success"
                        title="Approve"
                        onClick={() => approveMutation.mutate(request._id)}
                      >
                        <IconCheck size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        title="Reject"
                        onClick={() => rejectMutation.mutate(request._id)}
                      >
                        <IconX size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <TextField
            label="Review note (optional)"
            fullWidth
            size="small"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            helperText="Applied to the next approve/reject action"
          />
        </DashboardCard>
      )}

      {isBusinessOwner && !isSuperAdmin && (
        <DashboardCard title="My Category Requests">
          {requestsLoading && <Typography>Loading requests...</Typography>}
          {ownerRequests.length === 0 && !requestsLoading && (
            <Typography color="textSecondary">No category requests yet.</Typography>
          )}
          {ownerRequests.length > 0 && (
            <Paper variant="outlined" sx={{ overflowX: 'auto', mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Parent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Review Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ownerRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>{request.name}</TableCell>
                      <TableCell>{getRequestParentName(request)}</TableCell>
                      <TableCell>
                        <Chip label={request.status} size="small" color={statusColor(request.status)} />
                      </TableCell>
                      <TableCell>{request.reviewNote || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </DashboardCard>
      )}

      <DashboardCard title="Live Categories">
        {deleteError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError('')}>
            {deleteError}
          </Alert>
        )}
        {isLoading && <Typography>Loading...</Typography>}
        {categories && (
          <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Icon</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Sort</TableCell>
                  {isSuperAdmin && <TableCell>Status</TableCell>}
                  {isSuperAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 8 : 6} align="center">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  orderedCategories.map((c) => {
                    const depth = getCategoryDepth(c, categories);
                    const parentId = getCategoryParentId(c);
                    const parent = parentId ? categories.find((item) => item._id === parentId) : null;

                    return (
                      <TableRow key={c._id}>
                        <TableCell sx={{ pl: 2 + depth * 2 }}>
                          <CategoryIconPreview category={c} />
                        </TableCell>
                        <TableCell>
                          <CategoryImagePreview category={c} />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600} sx={{ pl: depth * 2 }}>
                            {c.name}
                          </Typography>
                          {c.description && (
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ pl: depth * 2, display: 'block' }}
                            >
                              {c.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{parent?.name || '—'}</TableCell>
                        <TableCell>{c.slug}</TableCell>
                        <TableCell>{c.sortOrder}</TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <Chip
                              label={c.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={c.isActive ? 'success' : 'default'}
                            />
                          </TableCell>
                        )}
                        {isSuperAdmin && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenEdit(c)}>
                              <IconEdit size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete category "${c.name}"? Categories with subcategories or assigned services cannot be deleted.`,
                                  )
                                ) {
                                  setDeleteError('');
                                  deleteMutation.mutate(c._id);
                                }
                              }}
                            >
                              <IconTrash size={18} />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </DashboardCard>

      {isSuperAdmin && (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Category Image (1:1, max 512×512px)
                </Typography>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar
                    src={imagePreview || undefined}
                    variant="rounded"
                    sx={{ width: 80, height: 80, border: '1px dashed #ccc' }}
                  >
                    <IconPhoto size={28} />
                  </Avatar>
                  <Button variant="outlined" component="label" disabled={uploadingImage}>
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                    />
                  </Button>
                  {form.image && (
                    <Button
                      color="error"
                      size="small"
                      onClick={() => {
                        setForm({ ...form, image: '' });
                        setImagePreview(null);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
              </Box>

              <TextField
                select
                label="Parent Category"
                fullWidth
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                helperText="Leave empty for a top-level category"
              >
                <MenuItem value="">None (top-level)</MenuItem>
                {parentOptions.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {getParentLabel(category, categories || [])}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Category Name"
                fullWidth
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Category Icon
                </Typography>
                <IconPicker
                  value={form.icon}
                  onChange={(icon) => setForm({ ...form, icon })}
                  defaultIcon={DEFAULT_CATEGORY_ICON}
                  helper="Icon shown when no category image is uploaded. Supports Solar, Hugeicons, MDI, Lucide, Tabler, and Phosphor."
                />
              </Box>
              <TextField
                label="Sort Order"
                type="number"
                fullWidth
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })}
              />

              {editing && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              )}

              <Button
                variant="contained"
                onClick={() => saveMutation.mutate()}
                disabled={!form.name || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      )}

      {isBusinessOwner && !isSuperAdmin && (
        <Dialog open={requestOpen} onClose={() => setRequestOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Request New Category</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {requestError && <Alert severity="error">{requestError}</Alert>}
              <Alert severity="info">
                Your request will be reviewed by a super admin. Once approved, the category goes live globally.
              </Alert>

              <TextField
                select
                label="Parent Category (optional)"
                fullWidth
                value={requestForm.parentId}
                onChange={(e) => setRequestForm({ ...requestForm, parentId: e.target.value })}
              >
                <MenuItem value="">None (top-level)</MenuItem>
                {orderedCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {getParentLabel(category, categories || [])}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Category Name"
                fullWidth
                required
                value={requestForm.name}
                onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={requestForm.description}
                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
              />
              <TextField
                label="Sort Order"
                type="number"
                fullWidth
                value={requestForm.sortOrder}
                onChange={(e) => setRequestForm({ ...requestForm, sortOrder: +e.target.value })}
              />

              <Button
                variant="contained"
                onClick={() => requestMutation.mutate()}
                disabled={!requestForm.name || requestMutation.isPending}
              >
                {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
