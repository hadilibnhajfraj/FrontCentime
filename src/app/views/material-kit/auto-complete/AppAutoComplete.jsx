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
import MDEditor from "@uiw/react-md-editor";
import axios from "axios";
import { startTransition } from "react";
import { useNavigate } from "react-router-dom";

const tabLabels = [
  "Prestation",
  "Description détaillée",
  "Interfaces / Risques",
  "Livrables",
  "Intervenants",
  "Suivi Qualité",
  "Commercial",
  "Les Échantillons",
  "Configuration"
];

export default function AjouterDocumentForm({ documentId }) {
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    numPrestation: "",
    nom_projet: "",
    activite: "",
    client: "",
    departement: "",
    iat: "",
    chefProjet: "",
    intervenants: "",
    dateCreation: "",
    dateDebutPrevue: "",
    dateFacturation: "",
    dateOffre: "",
    dateCloture: "",
    dateReception: "",
    etat: "",
    entete_texte: "",
    actif: true,
    type: "",
    adresse_client: "",
    reference_bordereau: "",
    bureau_order: "",
    t: "",
    pays: "",
    date: ""
  });

  const [clients, setClients] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:4000/api/auth/clients").then((res) => setClients(res.data));
    axios.get("http://localhost:4000/departments/getAll").then((res) => setDepartements(res.data));
  }, []);

  useEffect(() => {
    if (documentId) {
      axios.get(`http://localhost:4000/dossier/${documentId}`).then((res) => {
        const d = res.data;
        setFormData({ ...formData, ...d });
      });
    }
  }, [documentId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleMarkdownChange = (value) => {
    setFormData((prev) => ({ ...prev, entete_texte: value }));
  };

 /* const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = documentId ? `http://localhost:4000/dossier/${documentId}` : "http://localhost:4000/dossier/";
      const method = documentId ? "put" : "post";
      await axios({ method, url, data: formData });
      alert("Dossier enregistré avec succès");
      startTransition(() => navigate("/dashboard/default"));
    } catch (error) {
      console.error("Erreur :", error);
      alert("Une erreur est survenue.");
    }
  };*/
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // 1. Enregistrer la prestation dans /dossier/
    const dossierPayload = {
      numPrestation: formData.numPrestation,
      nom_projet: formData.nom_projet,
      activite: formData.activite,
      client: formData.client,
      departement: formData.departement,
      iat: formData.iat,
      chefProjet: formData.chefProjet,
      intervenants: formData.intervenants,
      dateCreation: formData.dateCreation,
      dateDebutPrevue: formData.dateDebutPrevue,
      dateFacturation: formData.dateFacturation,
      dateOffre: formData.dateOffre,
      dateCloture: formData.dateCloture,
      dateReception: formData.dateReception,
      etat: formData.etat,
      actif: formData.actif
    };

    const dossierUrl = documentId
      ? `http://localhost:4000/dossier/${documentId}`
      : "http://localhost:4000/dossier/";
    const dossierMethod = documentId ? "put" : "post";

    const dossierResponse = await axios({
      method: dossierMethod,
      url: dossierUrl,
      data: dossierPayload
    });

    const dossierId = documentId
      ? documentId
      : dossierResponse.data?.id || dossierResponse.data?.dossier?.id;

    // 2. Enregistrer le document lié à cette prestation (dans /document/)
    const documentFormData = new FormData();
    documentFormData.append("type", formData.type || "");
    documentFormData.append("adresse_client", formData.adresse_client || "");
    documentFormData.append("reference_bordereau", formData.reference_bordereau || "");
    documentFormData.append("bureau_order", formData.bureau_order || "");
    documentFormData.append("t", formData.t || "");
    documentFormData.append("pays", formData.pays || "");
    documentFormData.append("date", formData.date || "");
    documentFormData.append("entete_texte", formData.entete_texte || "");
    documentFormData.append("actif", formData.actif);
    documentFormData.append("dossierId", dossierId);

    if (selectedFile) {
      documentFormData.append("file", selectedFile);
    }

    await axios.post("http://localhost:4000/document/", documentFormData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    alert("Dossier et document enregistrés avec succès ✅");
    startTransition(() => navigate("/dashboard/default"));
  } catch (error) {
    console.error("Erreur :", error);
    alert("❌ Une erreur est survenue.");
  }
};

  const handleTabChange = (_, newValue) => setTabIndex(newValue);

  return (
    <Box p={3} bgcolor="#fff" borderRadius={2} boxShadow={2}>
      <Typography variant="h6" gutterBottom>
        {documentId ? "✏️ Modifier un Document" : "📝 Ajouter un Document"}
      </Typography>

      <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        {tabLabels.map((label, index) => (
          <Tab key={index} label={label} />
        ))}
      </Tabs>

      <form onSubmit={handleSubmit}>
        {tabIndex === 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold", color: "purple" }}>
              Direction de la Prestation
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField label="Numéro Prestation" name="numPrestation" value={formData.numPrestation} onChange={handleChange} fullWidth required /></Grid>
              <Grid item xs={12} md={6}><TextField label="Nom du projet" name="nom_projet" value={formData.nom_projet} onChange={handleChange} fullWidth required /></Grid>
              <Grid item xs={12} md={6}><TextField label="Activité" name="activite" value={formData.activite} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>Client</InputLabel><Select name="client" value={formData.client} onChange={handleChange}>{clients.map((cli) => (<MenuItem key={cli.id} value={cli.id}>{cli.name || cli.login}</MenuItem>))}</Select></FormControl></Grid>
              <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>Département</InputLabel><Select name="departement" value={formData.departement} onChange={handleChange}>{departements.map((dep) => (<MenuItem key={dep.id} value={dep.name}>{dep.name}</MenuItem>))}</Select></FormControl></Grid>
              <Grid item xs={12} md={6}><TextField label="IAT" name="iat" value={formData.iat} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} md={6}><TextField label="Chef du Projet" name="chefProjet" value={formData.chefProjet} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="Intervenants" name="intervenants" value={formData.intervenants} onChange={handleChange} fullWidth multiline rows={3} /></Grid>
              {["dateCreation", "dateDebutPrevue", "dateFacturation", "dateOffre", "dateCloture", "dateReception"].map((name) => (
                <Grid item xs={12} md={6} key={name}>
                  <TextField label={name} name={name} type="date" value={formData[name]} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
                </Grid>
              ))}
              <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>État</InputLabel><Select name="etat" value={formData.etat} onChange={handleChange}><MenuItem value="Ouvert">Ouvert</MenuItem><MenuItem value="En cours">En cours</MenuItem><MenuItem value="Terminé">Terminé</MenuItem><MenuItem value="Archivé">Archivé</MenuItem></Select></FormControl></Grid>
            </Grid>

            <Box display="flex" justifyContent="flex-end" mt={4}>
              <Button
                variant="contained"
                onClick={() => {
                  const requiredFields = ["numPrestation", "nom_projet"];
                  const isValid = requiredFields.every((field) => formData[field]?.trim() !== "");
                  if (!isValid) {
                    alert("Veuillez remplir tous les champs obligatoires de la Prestation.");
                    return;
                  }
                  setTabIndex(1);
                }}
              >
                Suivant
              </Button>
            </Box>
          </Box>
        )}

        {tabIndex === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold", color: "purple" }}>Description détaillée du document</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField label="Type" name="type" value={formData.type} onChange={handleChange} fullWidth required /></Grid>
              <Grid item xs={12} md={6}><TextField label="Adresse client" name="adresse_client" value={formData.adresse_client} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} md={6}><TextField label="Référence Bordereau" name="reference_bordereau" value={formData.reference_bordereau} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} md={6}><TextField label="Bureau d'ordre" name="bureau_order" value={formData.bureau_order} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} md={6}><TextField label="T" name="t" value={formData.t} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} md={6}><TextField label="Pays" name="pays" value={formData.pays} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} md={6}><TextField label="Date du document" name="date" type="date" value={formData.date} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth /></Grid>
              <Grid item xs={12} md={6}><Button variant="outlined" component="label" fullWidth>Choisir un fichier<input type="file" hidden onChange={(e) => setSelectedFile(e.target.files[0])} /></Button>{selectedFile && (<Typography variant="body2" mt={1}>📎 Fichier sélectionné : {selectedFile.name}</Typography>)}</Grid>
              <Grid item xs={12}><Typography variant="subtitle2" sx={{ mb: 1 }}>Entête-texte (contenu détaillé)</Typography><Box data-color-mode="light"><MDEditor value={formData.entete_texte} onChange={(val) => handleMarkdownChange(val)} height={200} /></Box></Grid>
              <Grid item xs={12}><FormControlLabel control={<Checkbox checked={formData.actif ?? true} onChange={handleChange} name="actif" />} label="Document actif" /></Grid>
            </Grid>
            <Box display="flex" justifyContent="space-between" mt={4}>
              <Button variant="outlined" onClick={() => setTabIndex(0)}>Retour</Button>
              <Button type="submit" variant="contained" color="primary">{documentId ? "Mettre à jour" : "Enregistrer"}</Button>
            </Box>
          </Box>
        )}

        {tabIndex > 1 && (
          <Typography color="text.secondary">Contenu de l’onglet « {tabLabels[tabIndex]} » à venir…</Typography>
        )}
      </form>
    </Box>
  );
}
