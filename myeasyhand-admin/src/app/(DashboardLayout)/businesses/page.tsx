'use client';

import { useQuery } from '@tanstack/react-query';
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
} from '@mui/material';
import { businessApi } from '@/lib/api';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

interface Business {
  _id: string;
  name: string;
  email: string;
  status: string;
  phone?: string;
}

export default function BusinessesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const res = await businessApi.list();
      return res.data.data as Business[];
    },
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Businesses
      </Typography>
      <DashboardCard title="All Businesses">
        {isLoading && <Typography>Loading...</Typography>}
        {error && <Typography color="error">Failed to load businesses</Typography>}
        {data && (
          <Paper variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No businesses found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell>{b.name}</TableCell>
                      <TableCell>{b.email}</TableCell>
                      <TableCell>{b.phone || '—'}</TableCell>
                      <TableCell>
                        <Chip label={b.status} size="small" color={b.status === 'active' ? 'success' : 'default'} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </DashboardCard>
    </Box>
  );
}
