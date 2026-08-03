import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import type { PlannerData } from '../types'

interface DashboardPageProps {
  data: PlannerData
  onBack: () => void
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/[\u00a0\u202f]/g, ' ')

const escapeCsv = (value: string | number | boolean | undefined) =>
  `"${String(value ?? '').replaceAll('"', '""')}"`

const formatReportDate = (value?: string) => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `'${day}.${month}.${year}`
}

const DashboardPage = ({ data, onBack }: DashboardPageProps) => {
  const items = data.sections.flatMap((section) =>
    section.items.map((item) => ({ ...item, sectionTitle: section.title })),
  )
  const completedItems = items.filter((item) => item.checked).length
  const totalCost = items.reduce((sum, item) => sum + (item.cost ?? 0), 0)
  const pricedItems = items.filter((item) => item.cost !== undefined).length
  const completion = items.length ? Math.round((completedItems / items.length) * 100) : 0
  const today = new Date().toISOString().slice(0, 10)
  const upcomingItems = items
    .filter((item) => item.dueDate && item.dueDate >= today && !item.checked)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 6)
  const overdueItems = items.filter(
    (item) => item.dueDate && item.dueDate < today && !item.checked,
  ).length
  const sectionCosts = data.sections
    .map((section) => ({
      id: section.id,
      title: section.title,
      cost: section.items.reduce((sum, item) => sum + (item.cost ?? 0), 0),
      completed: section.items.filter((item) => item.checked).length,
      total: section.items.length,
    }))
    .sort((a, b) => b.cost - a.cost)
  const maxSectionCost = Math.max(...sectionCosts.map((section) => section.cost), 1)

  const handleDownloadReport = () => {
    const header = [
      'Sekcja',
      'Zadanie',
      'Status',
      'Ukonczone',
      'Polubione',
      'Termin',
      'Koszt PLN',
      'Liczba notatek',
    ]
    const rows = data.sections.flatMap((section) =>
      section.items.map((item) => [
        section.title,
        item.title,
        item.status,
        item.checked ? 'Tak' : 'Nie',
        item.favorite ? 'Tak' : 'Nie',
        formatReportDate(item.dueDate),
        item.cost,
        item.notes.length,
      ]),
    )
    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsv(value)).join(';'))
      .join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `raport-planera-${today}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

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
            onClick={handleDownloadReport}
          >
            Pobierz raport
          </Button>
        </Stack>

        <Box className="dashboard-grid">
          {[
            { label: 'Postep', value: `${completion}%`, detail: `${completedItems}/${items.length} zadan` },
            { label: 'Laczny koszt', value: formatCurrency(totalCost), detail: `${pricedItems} wycenionych zadan` },
            { label: 'Sekcje', value: data.sections.length, detail: `${items.length} zadan lacznie` },
            { label: 'Po terminie', value: overdueItems, detail: 'nieukonczonych zadan' },
          ].map((stat) => (
            <Paper key={stat.label} className="dashboard-card" elevation={0}>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography
                variant="h5"
                className="dashboard-stat-value"
                sx={{ fontWeight: 700, marginY: 0.5 }}
              >
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.detail}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Paper className="dashboard-panel" elevation={0}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Koszty wedlug sekcji
          </Typography>
          <Stack spacing={1.75} sx={{ marginTop: 2 }}>
            {sectionCosts.map((section) => (
              <Box key={section.id}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body2">{formatCurrency(section.cost)}</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(section.cost / maxSectionCost) * 100}
                  sx={{ marginTop: 0.75, height: 7, borderRadius: 999 }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>

        <Box className="dashboard-columns">
          <Paper className="dashboard-panel" elevation={0}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Realizacja sekcji
            </Typography>
            <Stack divider={<Divider flexItem />} sx={{ marginTop: 1 }}>
              {sectionCosts.map((section) => (
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

          <Paper className="dashboard-panel" elevation={0}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Najblizsze terminy
            </Typography>
            {upcomingItems.length ? (
              <Stack divider={<Divider flexItem />} sx={{ marginTop: 1 }}>
                {upcomingItems.map((item) => (
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
        </Box>
    </Stack>
  )
}

export default DashboardPage
