import { Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import type { DashboardSection } from '../../utils/dashboard'

interface SectionProgressPanelProps {
  sections: DashboardSection[]
}

const SectionProgressPanel = ({ sections }: SectionProgressPanelProps) => (
  <Paper className="dashboard-panel" elevation={0}>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      Realizacja sekcji
    </Typography>
    <Stack divider={<Divider flexItem />} sx={{ marginTop: 1 }}>
      {sections.map((section) => (
        <Stack
          key={section.id}
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'space-between', paddingY: 1.25 }}
        >
          <Typography variant="body2">{section.title}</Typography>
          <Chip
            size="small"
            label={`${section.completed}/${section.total}`}
            color={section.total > 0 && section.completed === section.total ? 'success' : 'default'}
          />
        </Stack>
      ))}
    </Stack>
  </Paper>
)

export default SectionProgressPanel

