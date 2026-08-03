import { Button, Divider, Popover, Stack, Typography } from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import type { PlannerSummary } from '../../utils/plannerData'

interface SummaryPopoverProps {
  anchor: HTMLElement | null
  summary: PlannerSummary
  sectionCount: number
  onClose: () => void
  onOpenDashboard: () => void
}

const SummaryPopover = ({
  anchor,
  summary,
  sectionCount,
  onClose,
  onOpenDashboard,
}: SummaryPopoverProps) => (
  <Popover
    open={Boolean(anchor)}
    anchorEl={anchor}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
  >
    <Stack spacing={1.5} sx={{ padding: 2, minWidth: 220 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Podsumowanie
      </Typography>
      <Divider />
      <Typography variant="body2">
        Zadania: {summary.doneTasks}/{summary.totalTasks}
      </Typography>
      <Typography variant="body2">Suma kosztow: {summary.totalCost} zl</Typography>
      <Typography variant="body2">Sekcje: {sectionCount}</Typography>
      <Button
        size="small"
        endIcon={<DashboardRoundedIcon />}
        onClick={onOpenDashboard}
        sx={{ alignSelf: 'flex-start', padding: 0 }}
      >
        Wiecej szczegolow
      </Button>
    </Stack>
  </Popover>
)

export default SummaryPopover

