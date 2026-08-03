import { useMemo } from 'react'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import type { PlannerData } from '../types'
import { downloadPlannerReport, getDashboardMetrics } from '../utils/dashboard'
import DashboardStats from './dashboard/DashboardStats'
import SectionCostsPanel from './dashboard/SectionCostsPanel'
import SectionProgressPanel from './dashboard/SectionProgressPanel'
import UpcomingDeadlinesPanel from './dashboard/UpcomingDeadlinesPanel'

interface DashboardPageProps {
  data: PlannerData
  onBack: () => void
}

const DashboardPage = ({ data, onBack }: DashboardPageProps) => {
  const metrics = useMemo(() => getDashboardMetrics(data), [data])
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <IconButton onClick={onBack} size="small" aria-label="Wroc do planera">
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pelny obraz przygotowan, kosztow i terminow.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadRoundedIcon />}
          onClick={() => downloadPlannerReport(data)}
        >
          Pobierz raport
        </Button>
      </Stack>
      <DashboardStats metrics={metrics} sectionCount={data.sections.length} />
      <SectionCostsPanel sections={metrics.sections} maxCost={metrics.maxSectionCost} />
      <Box className="dashboard-columns">
        <SectionProgressPanel sections={metrics.sections} />
        <UpcomingDeadlinesPanel items={metrics.upcomingItems} />
      </Box>
    </Stack>
  )
}

export default DashboardPage
