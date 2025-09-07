import { useEffect, useState, useMemo } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  Box, Breadcrumbs, Chip, CircularProgress, Divider, Grid, Link, Paper,
  Stack, Typography, Card, CardContent, IconButton, Tooltip, Collapse
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const API_BASE = "http://localhost:4000";

const TECH_TO_FR = {
  closed: "Clôturé",
  done: "Réalisée",
  draft: "Demande",
  open: "Affectée",
  rejected: "Rejeté",
};

function Field({ label, value }) {
  const v = value === null || value === undefined || value === "" ? "—" : value;
  return (
    <Stack spacing={0.5} sx={{ p: 1 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{v}</Typography>
    </Stack>
  );
}

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleString("fr-FR");
};

export default function PrestationDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null); // { row, documents }
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${API_BASE}/dossier/${id}/full`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (mounted) setData(j);
      } catch (e) {
        if (mounted) setErr(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // 👉 TOUS LES HOOKS AVANT LES RETURN CONDITIONNELS
  const row = data?.row ?? null;
  const enteteRaw = row?.entete ?? "";
  const descRaw = row?.desctiption ?? "";

  const enteteSafe = useMemo(
    () => ({ __html: DOMPurify.sanitize(String(enteteRaw)) }),
    [enteteRaw]
  );
  const descSafe = useMemo(
    () => ({ __html: DOMPurify.sanitize(String(descRaw)) }),
    [descRaw]
  );

  if (loading) return <Box p={3}><CircularProgress size={28} /></Box>;
  if (err || !row) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">Impossible de charger la prestation</Typography>
        <Typography variant="body2" color="text.secondary">{err || "Non trouvée"}</Typography>
      </Box>
    );
  }

  const r = row;
  const numero = r.prestation || r.name_primary || `#${id}`;
  const stateFR = TECH_TO_FR[String(r.state || "").toLowerCase()] || r.state || "—";

  const dept = r.department_name ?? r.department_id ?? "—";
  const activity = r.activity_name ?? r.activity_id ?? "—";
  const country = r.country_name ?? r.country_id ?? "—";
  const analytic =
    r.analytic_code || r.analytic_name
      ? [r.analytic_code, r.analytic_name].filter(Boolean).join(" — ")
      : (r.analytic_account_id ?? "—");
  const responsable = r.responsible_name ?? r.responsible1_name ?? r.responsible_id ?? "—";

  return (
    <Box p={3}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/">
          Accueil
        </Link>
        <Link component={RouterLink} underline="hover" color="inherit" to="/document/prestation">
          Prestations
        </Link>
        <Typography color="text.primary">{numero}</Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={600}>{numero}</Typography>
        <Chip label={stateFR} />
        <Box flex={1} />
        <Typography variant="body2" color="text.secondary">ID interne: {r.id}</Typography>
      </Stack>

      <Card variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}><Field label="Nom du projet" value={r.name_primary} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field label="Référence bordereau" value={r.reference_bordereau} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field label="Département" value={dept} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field label="Activité" value={activity} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field label="Date" value={fmtDate(r.date)} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field label="Date création" value={fmtDate(r.create_date || r.date_creation)} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field label="Compte analytique" value={analytic} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field label="Pays" value={country} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field label="Responsable" value={responsable} /></Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Entête</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 0.5, borderRadius: 2 }}>
                {r.entete
                  ? <Box sx={{ "& p": { m: 0, mb: 1 } }} dangerouslySetInnerHTML={enteteSafe} />
                  : <Typography color="text.secondary">—</Typography>}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Description</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 0.5, borderRadius: 2 }}>
                {r.desctiption
                  ? <Box sx={{ "& p": { m: 0, mb: 1 } }} dangerouslySetInnerHTML={descSafe} />
                  : <Typography color="text.secondary">—</Typography>}
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Documents</Typography>
          </Stack>
          {Array.isArray(data.documents) && data.documents.length > 0 ? (
            <Stack spacing={1}>
              {data.documents.map((d) => (
                <Stack key={d.id} direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2">#{d.id}</Typography>
                  <Typography variant="body2">{d.type}</Typography>
                  <Typography variant="body2" color="text.secondary">{d.date ? fmtDate(d.date) : "—"}</Typography>
                  <Link href={d.cheminFichier} target="_blank" rel="noreferrer">ouvrir</Link>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">Aucun document.</Typography>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Détails techniques</Typography>
            <Tooltip title={showSql ? "Masquer" : "Afficher"}>
              <IconButton onClick={() => setShowSql((s) => !s)} size="small">
                <ExpandMoreIcon
                  sx={{ transform: showSql ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }}
                />
              </IconButton>
            </Tooltip>
          </Stack>
          <Collapse in={showSql}>
            <Divider sx={{ mb: 2 }} />
            <Grid container>
              {Object.entries(r).map(([k, v]) => (
                <Grid key={k} item xs={12} sm={6} md={4}>
                  <Field label={k} value={v ?? "—"} />
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
}
