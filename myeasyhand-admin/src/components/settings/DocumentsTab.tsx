'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { IconDownload, IconUpload } from '@tabler/icons-react';
import {
  BusinessDocumentItem,
  DOCUMENT_CATEGORIES,
  DocumentCategory,
  mediaApi,
  serviceOwnerApi,
} from '@/lib/api';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  identity: 'Identity Documents',
  business: 'Business Documents',
  bank: 'Bank Verification',
  address: 'Address Verification',
  employee: 'Employee Verification',
};

function statusColor(status: BusinessDocumentItem['status']): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'approved') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'rejected' || status === 'expired') return 'error';
  return 'default';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DocumentsTab() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<DocumentCategory>('identity');
  const [docType, setDocType] = useState(DOCUMENT_CATEGORIES.identity[0]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['business-documents'],
    queryFn: async () => (await serviceOwnerApi.listDocuments()).data.data,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const mediaRes = await mediaApi.uploadBusinessDocument(file);
      const { url, fileName } = mediaRes.data.data;
      return serviceOwnerApi.uploadDocument({ type: docType, filePath: url, fileName, category });
    },
    onSuccess: () => {
      setSuccess('Document uploaded. Awaiting admin verification.');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['business-documents'] });
      queryClient.invalidateQueries({ queryKey: ['owner-profile-overview'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Failed to upload document');
      setSuccess('');
    },
    onSettled: () => setUploading(false),
  });

  const filtered = documents.filter((d) => (d.category ?? 'business') === category);
  const approved = documents.filter((d) => d.status === 'approved').length;
  const pending = documents.filter((d) => d.status === 'pending').length;
  const rejected = documents.filter((d) => d.status === 'rejected').length;

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Chip label={`${approved} approved`} color="success" size="small" />
        <Chip label={`${pending} pending`} color="warning" size="small" />
        <Chip label={`${rejected} rejected`} color="error" size="small" />
      </Stack>

      <Tabs value={category} onChange={(_, v) => {
        setCategory(v);
        setDocType(DOCUMENT_CATEGORIES[v as DocumentCategory][0]);
      }} variant="scrollable">
        {(Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]).map((cat) => (
          <Tab key={cat} label={CATEGORY_LABELS[cat]} value={cat} />
        ))}
      </Tabs>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
          Upload — {CATEGORY_LABELS[category]}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
          <TextField select label="Document Type" value={docType} onChange={(e) => setDocType(e.target.value)} size="small" sx={{ minWidth: 240 }}>
            {DOCUMENT_CATEGORIES[category].map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" hidden onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) { setUploading(true); uploadMutation.mutate(file); }
            e.target.value = '';
          }} />
          <Button variant="contained" startIcon={<IconUpload size={18} />}
            onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Choose File'}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Rejected documents can be re-uploaded. Admin verification notes appear in the table below.
        </Typography>
      </Paper>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Verification Notes</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No documents in this category</Typography>
                </TableCell>
              </TableRow>
            ) : filtered.map((doc) => (
              <TableRow key={doc._id} hover>
                <TableCell>{doc.type}</TableCell>
                <TableCell>{doc.fileName}</TableCell>
                <TableCell><Chip label={doc.status} size="small" color={statusColor(doc.status)} /></TableCell>
                <TableCell>{formatDate(doc.createdAt)}</TableCell>
                <TableCell>{doc.remarks ?? (doc.status === 'rejected' ? 'Please re-upload' : '—')}</TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<IconDownload size={16} />}
                    href={doc.filePath} target="_blank" rel="noopener noreferrer">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
