import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Tabs,
  Tab,
  InputLabel,
  FormControl,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import MDEditor from "@uiw/react-md-editor";
import axios from "axios";

const BASE = "http://localhost:4000";
const API = {
  activities: (q = "") => `${BASE}/routes/activities${q ? `?q=${encodeURIComponent(q)}` : ""}`,
  departments: () => `${BASE}/routes/departments`,
  clients: (q = "") => `${BASE}/routes/users/by-group?group=client${q ? `&q=${encodeURIComponent(q)}` : ""}`,
  dossier: () => `${BASE}/dossier/`
};

const TABS = ["Prestation", "Description détaillée (à venir)"];

export default function AjouterDocumentForm() {
  const [tabIndex, setTabIndex] = useState(0);

  // ====== ÉTATS IDENTIQUES AU FORMULAIRE ORIGINEL DE PRESTATION ======
  const [formData, setFormData] = useState({
    nom_projet: "",
    activityId: null,
    activite: "",
    date: "",
    entete_texte: "",

    clientId: null,
    client: "",
    adresse_client: "",
    departmentId: null,
    departement: "",
    reference_bordereau: "",
    bureau_order: "",
    t: false,
    iat: "",
    pays: "Tunisie",
  });

  const [activities, setActivities] = useState([]);
  const [clients, setClients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [countries] = useState(["Tunisie", "France", "Maroc", "Algérie"]);

  const setField = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  // ====== LOOKUPS IDENTIQUES ======
  useEffect(() => {
    axios.get(API.departments()).then((r) => setDepartments(Array.isArray(r.data) ? r.data : []));
  }, []);
  useEffect(() => {
    axios.get(API.activities()).then((r) => setActivities(Array.isArray(r.data) ? r.data : []));
  }, []);
  useEffect(() => {
    axios.get(API.clients()).then((r) => setClients(Array.isArray(r.data) ? r.data : []));
  }, []);

  const fetchActivities = async (q) => {
    const { data } = await axios.get(API.activities(q));
    setActivities(Array.isArray(data) ? data : []);
  };
  const fetchClients = async (q) => {
    const { data } = await axios.get(API.clients(q));
    setClients(Array.isArray(data) ? data : []);
  };

  const onClientChange = (_e, opt) => {
    setField("clientId", opt?.value || null);
    setField("client", opt?.label || opt?.name || "");
    const guessAddress = opt?.address || opt?.email || "";
    if (guessAddress) setField("adresse_client", guessAddress);
  };

  // ====== SUBMIT IDENTIQUE (payload et routes inchangés) ======
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom_projet?.trim()) return alert("Nom du projet est requis.");
    if (!formData.activityId && !formData.activite) return alert("Sélectionnez l’activité.");
    if (!formData.clientId && !formData.client) return alert("Sélectionnez le client.");
    if (!formData.departmentId && !formData.departement)
      return alert("Sélectionnez le département.");

    try {
      const payload = {
        activityId: formData.activityId,
        departmentId: formData.departmentId,
        clientId: formData.clientId,
        activite: formData.activite,
        departement: formData.departement,
        client: formData.client,

        nom_projet: formData.nom_projet,
        date: formData.date,
        entete_texte: formData.entete_texte,
        reference_bordereau: formData.reference_bordereau,
        bureau_order: formData.bureau_order,
        t: formData.t,
        iat: formData.iat,
        pays: formData.pays,
        adresse_client: formData.adresse_client,
      };

      console.log("[Dossier] payload envoyé ->", payload);

      await axios.post(API.dossier(), payload);
      alert("Prestation créée ✅");

      setFormData((f) => ({ ...f, nom_projet: "", date: "", entete_texte: "" }));
    } catch (err) {
      console.error("[Dossier] erreur POST /dossier", err?.response?.data || err);
      alert("❌ Erreur lors de l’enregistrement.");
    }
  };

  // Helpers pour valeurs des listes
  const activitiesList = Array.isArray(activities) ? activities : [];
  const clientsList = Array.isArray(clients) ? clients : [];
  const departmentsList = Array.isArray(departments) ? departments : [];

  return (
    <Box p={3} bgcolor="#fff" borderRadius={2} boxShadow={2}>
      <Typography variant="h6" gutterBottom>
        Créer une prestation
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {TABS.map((label, i) => <Tab key={i} label={label} />)}
      </Tabs>

      <form onSubmit={handleSubmit}>
        {/* ====== ONGLET 0 : PRESTATION (COPIÉ À L’IDENTIQUE) ====== */}
        {tabIndex === 0 && (
          <Grid container spacing={3}>
            {/* --- COLONNE GAUCHE --- */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Nom du projet"
                    value={formData.nom_projet}
                    onChange={(e) => setField("nom_projet", e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    options={activitiesList}
                    getOptionLabel={(o) => o?.label ?? ""}
                    value={
                      activitiesList.find((a) => String(a.value) === String(formData.activityId)) ||
                      null
                    }
                    onChange={(_, opt) => {
                      setField("activityId", opt?.value || null);
                      setField("activite", opt?.label || "");
                    }}
                    onInputChange={(_, q) => fetchActivities(q)}
                    renderInput={(params) => <TextField {...params} label="Activité" fullWidth />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Date"
                    type="date"
                    value={formData.date || ""}
                    onChange={(e) => setField("date", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Entête-texte
                  </Typography>
                  <Box data-color-mode="light">
                    <MDEditor
                      value={formData.entete_texte}
                      onChange={(v) => setField("entete_texte", v || "")}
                      height={180}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* --- COLONNE DROITE --- */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={clientsList}
                    getOptionLabel={(o) => o?.label ?? o?.name ?? ""}
                    value={
                      clientsList.find((c) => String(c.value) === String(formData.clientId)) || null
                    }
                    onChange={onClientChange}
                    onInputChange={(_, q) => fetchClients(q)}
                    renderInput={(params) => <TextField {...params} label="Client" fullWidth />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Adresse Client"
                    value={formData.adresse_client}
                    onChange={(e) => setField("adresse_client", e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Département</InputLabel>
                    <Select
                      label="Département"
                      value={formData.departmentId ?? ""}
                      onChange={(e) => {
                        const opt = departmentsList.find(
                          (d) => String(d.value) === String(e.target.value)
                        );
                        setField("departmentId", opt?.value || null);
                        setField("departement", opt?.label || "");
                      }}
                    >
                      {departmentsList.map((dep) => (
                        <MenuItem key={dep.value} value={dep.value}>
                          {dep.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Référence Bordereau (CTI)"
                    value={formData.reference_bordereau}
                    onChange={(e) => setField("reference_bordereau", e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Bureau d'ordre"
                    value={formData.bureau_order}
                    onChange={(e) => setField("bureau_order", e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!formData.t}
                        onChange={(e) => setField("t", e.target.checked)}
                      />
                    }
                    label="T"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="IAT"
                    value={formData.iat}
                    onChange={(e) => setField("iat", e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    options={countries}
                    freeSolo
                    value={formData.pays || ""}
                    onChange={(_, val) => setField("pays", val || "")}
                    onInputChange={(_, val) => setField("pays", val || "")}
                    renderInput={(params) => <TextField {...params} label="Pays" fullWidth />}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Button type="submit" variant="contained">
                  Enregistrer
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* ====== ONGLET 1 : PLACEHOLDER ====== */}
        {tabIndex === 1 && (
          <Typography color="text.secondary">
            Contenu « {TABS[1]} » à venir…
          </Typography>
        )}
      </form>
    </Box>
  );
}
