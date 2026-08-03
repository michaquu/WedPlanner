import { Box, Divider, Paper, Stack, Typography } from '@mui/material'
import type { DashboardItem } from '../../utils/dashboard'

interface UpcomingDeadlinesPanelProps {
  items: DashboardItem[]
}

const UpcomingDeadlinesPanel = ({ items }: UpcomingDeadlinesPanelProps) => (
  <Paper className="dashboard-panel" elevation={0}>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      Najblizsze terminy
    </Typography>
    {items.length ? (
      <Stack divider={<Divider flexItem />} sx={{ marginTop: 1 }}>
        {items.map((item) => (
          <Box key={item.id} sx={{ paddingY: 1.25 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.sectionTitle} · {item.dueDate}
            </Typography>
          </Box>
        ))}
      </Stack>
    ) : (
      <Typography variant="body2" color="text.secondary" sx={{ marginTop: 1.5 }}>
        Brak nadchodzacych terminow.
      </Typography>
    )}
  </Paper>
)

export default UpcomingDeadlinesPanel

